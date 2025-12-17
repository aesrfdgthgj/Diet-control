// server.js（CommonJS 正確版）
const path = require("path");
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 這一行才是你要的重點（服務前端）
app.use(express.static(__dirname));

// 這裡換成你自己的連線字串（就是剛剛 test-mongo.js 成功那個）
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let foodsCollection;
const mealTypeMap = {
  早餐: "breakfast",
  午餐: "lunch",
  晚餐: "dinner",
};

// 小小測試用
app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

// ✅ 取出資料庫內所有「餐廳」並去重（用 lat/lng，不用 Places/Geocoding）
app.get("/api/restaurants", async (req, res) => {
  try {
    if (!foodsCollection) {
      return res.status(500).json({ ok: false, error: "資料庫尚未連線" });
    }

    // 只撈 restaurant 欄位，省流量
    const items = await foodsCollection
      .find(
        { "restaurant.lat": { $exists: true }, "restaurant.lng": { $exists: true } },
        { projection: { restaurant: 1 } }
      )
      .toArray();

    // 去重：同店同座標只留一筆
    const map = new Map();
    for (const it of items) {
      const r = it.restaurant;
      if (!r?.lat || !r?.lng) continue;

      const key = `${r.name}|${r.lat}|${r.lng}`;
      if (!map.has(key)) {
        map.set(key, {
          name: r.name,
          address: r.address || null, // 你現在存的是 Google Maps URL 也OK
          lat: r.lat,
          lng: r.lng,
          count: 1, // 這家店在你的 foods 出現幾次
        });
      } else {
        map.get(key).count += 1;
      }
    }

    return res.json({ ok: true, restaurants: [...map.values()] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "load restaurants failed" });
  }
});

app.get("/api/restaurant-meals", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ ok: false, error: "lat/lng required" });
    }

    // 找出這家店的所有餐點（只回你要顯示的欄位）
    const meals = await foodsCollection
      .find(
        { "restaurant.lat": lat, "restaurant.lng": lng },
        {
          projection: {
            name: 1,
            mealType: 1,
            price: 1,
            kcal: 1,
            tags: 1,
            source: 1,
          },
        }
      )
      .toArray();

    res.json({ ok: true, meals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "query failed" });
  }
});


// 產生一天三餐的菜單
app.post("/api/generate-plan", async (req, res) => {
  try {
    if (!foodsCollection) {
      return res.status(500).json({ ok: false, error: "資料庫尚未連線" });
    }

    const {
      breakfastBudget,
      lunchBudget,
      dinnerBudget,
      breakfastType,
      lunchType,
      dinnerType,
      dailyCalorie,
    } = req.body;

    const totalCal = Number(dailyCalorie) || 1800;

    // ✅ 你原本的 30/40/30 分配（比較合理）
    const targets = {
      早餐: { budget: Number(breakfastBudget) || 0, type: breakfastType, cal: Math.round(totalCal * 0.3) },
      午餐: { budget: Number(lunchBudget) || 0, type: lunchType, cal: Math.round(totalCal * 0.4) },
      晚餐: { budget: Number(dinnerBudget) || 0, type: dinnerType, cal: Math.round(totalCal * 0.3) },
    };

    const result = {};
    const usedIds = [];

    for (const meal of ["早餐", "午餐", "晚餐"]) {
      const t = targets[meal]; // 預算、目標熱量、外食/自煮

      const query = {
        mealType: mealTypeMap[meal],        // ✅ 早餐/午餐/晚餐
        price: { $lte: t.budget },           // ✅ 預算上限
        source: t.type,                      // 外食 / 自煮
        kcal: {
          $gte: t.cal - 100,                 // ✅ 新邏輯
          $lte: t.cal
        }
      };

      const item = await foodsCollection
        .find(query)
        .sort({ kcal: -1 })                  // 🔥 很重要：越接近目標越好
        .limit(1)
        .toArray();

      result[meal] = {
        items: item.map(f => ({
          _id: String(f._id),
          name: f.name,
          price: f.price,
          kcal: f.kcal,
          source: f.source,
          restaurant: f.restaurant || null,
        })),
        totalKcal: item[0]?.kcal || 0
      };
    }


        return res.json({ ok: true, plan: result });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: "產生食譜失敗" });
      }
    });

app.post("/api/swap-meal", async (req, res) => {
  try {
    const { meal, budgets, types, dailyKcal, excludeIds = [] } = req.body;
    if (!meal) return res.status(400).json({ ok: false, error: "missing meal" });

    const total = Number(dailyKcal) || 1800;
    const targetMap = {
      早餐: Math.round(total * 0.3),
      午餐: Math.round(total * 0.4),
      晚餐: Math.round(total * 0.3),
    };

    const budgetMap = {
      早餐: Number(budgets?.breakfast || 0),
      午餐: Number(budgets?.lunch || 0),
      晚餐: Number(budgets?.dinner || 0),
    };

    const sourceMap = {
      早餐: types?.breakfast || "外食",
      午餐: types?.lunch || "外食",
      晚餐: types?.dinner || "外食",
    };

    const mealType = mealTypeMap[meal];
    const targetCal = targetMap[meal];
    const budget = budgetMap[meal];
    const source = sourceMap[meal];

    // 排除清單轉 ObjectId
    const { ObjectId } = require("mongodb");
    const oidList = excludeIds
      .map((id) => { try { return new ObjectId(id); } catch { return null; } })
      .filter(Boolean);

    const query = {
      ...(mealType ? { mealType } : {}),
      ...(source ? { source } : {}),
      ...(budget ? { price: { $lte: budget } } : {}),
      // ✅ 你指定的熱量區間： [目標-100, 目標]
      kcal: { $gte: targetCal - 100, $lte: targetCal },
      ...(oidList.length ? { _id: { $nin: oidList } } : {}),
    };

    // 取最接近目標（kcal 越高越接近）
    // 1) strict：你指定的條件
    let candidates = await foodsCollection
      .find(query)
      .sort({ kcal: -1 })
      .limit(5)
      .toArray();

    // 2) fallback A：先放寬 kcal（仍然不超過目標）
    //   原本: [target-100, target]
    //   放寬: [target-150, target]
    if (!candidates.length) {
      const relaxed = {
        ...query,
        kcal: { $gte: targetCal - 150, $lte: targetCal },
      };

      candidates = await foodsCollection
        .find(relaxed)
        .sort({ kcal: -1 })
        .limit(5)
        .toArray();
    }

    // 3) fallback B：kcal 不管了（但 mealType/source/budget 還在）
    //   這樣至少換得出來，不會一直 alert
    if (!candidates.length) {
      const looser = { ...query };
      delete looser.kcal;

      candidates = await foodsCollection
        .find(looser)
        .limit(5)
        .toArray();
    }

    // 4) 最後保底：只要同 mealType 就給一個（避免空白）
    if (!candidates.length) {
      const last = await foodsCollection
        .aggregate([
          { $match: { mealType } },
          { $sample: { size: 1 } }
        ])
        .toArray();

      candidates = last;
    }

    if (!candidates.length) {
      return res.json({ ok: true, item: null });
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    res.json({
      ok: true,
      meal,
      item: {
        _id: String(picked._id),
        name: picked.name,
        price: picked.price,
        kcal: picked.kcal,
        source: picked.source,
        restaurant: picked.restaurant || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "swap failed" });
  }
});

async function start() {
  try {
    await client.connect();
    const db = client.db("diet_planner");
    foodsCollection = db.collection("foods");
    console.log("MongoDB 連線成功");

    app.listen(3000, () => {
      console.log("後端 server 已啟動：http://localhost:3000");
    });
  } catch (err) {
    console.error("MongoDB 連線失敗", err);
  }
}

start();

(() => {
  let generatedPlan = null; // 儲存從後端拿回來的食譜結果
  const pageTitle = document.getElementById("page-title");
  const pageContent = document.getElementById("page-content");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const modalClose = document.getElementById("modal-close");
  const API_BASE = ""; // 同源：Render 上就是 https://你的站


  // 簡單模擬 Share UI: Card 元件
  function createCard({ title, subtitle, emoji, accent, onClick }) {
    const card = document.createElement("div");
    card.className = "card" + (accent === "orange" ? " orange" : "");
    card.style.textAlign = "center";

    const emojiDiv = document.createElement("div");
    emojiDiv.style.width = "7rem";
    emojiDiv.style.height = "7rem";
    emojiDiv.style.lineHeight = "7rem";
    emojiDiv.style.margin = "0 auto 0.75rem";
    emojiDiv.style.borderRadius = "1rem";
    emojiDiv.style.backgroundColor = accent === "orange" ? "#fb923c" : "#22c55e";
    emojiDiv.style.color = "white";
    emojiDiv.style.fontSize = accent === "orange" ? "3rem" : "4rem";
    emojiDiv.textContent = emoji;
    emojiDiv.style.display = "grid";
    emojiDiv.style.placeContent = "center";
    card.appendChild(emojiDiv);

    const titleDiv = document.createElement("div");
    titleDiv.style.fontWeight = "500";
    titleDiv.style.fontSize = accent === "orange" ? "1.125rem" : "1.25rem";
    titleDiv.textContent = title;
    card.appendChild(titleDiv);

    if (subtitle) {
      const subDiv = document.createElement("div");
      subDiv.style.fontSize = "0.875rem";
      subDiv.style.color = "#64748b"; // slate-600
      subDiv.textContent = subtitle;
      card.appendChild(subDiv);
    }

    if (onClick) {
      card.style.cursor = "pointer";
      card.addEventListener("click", onClick);
    }
    return card;
  }

  function getSelectedType(meal) {
    return (
      document.querySelector(
        `.type-btn.selected[data-meal="${meal}"]`
      )?.dataset.value || null
    );
  }

  // Modal 控制
  function showModal(title, content) {
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.classList.add("visible");
  }
  function closeModal() {
    modal.classList.remove("visible");
  }
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  // 各頁面函數
  function renderHome() {
    pageTitle.textContent = "主頁";
    pageContent.innerHTML = "";
    const container = document.createElement("div");
    container.className = "grid-2";

    // 健康飲食卡片
    container.appendChild(
      createCard({
        title: "健康飲食",
        subtitle: "小知識與飲食地圖",
        emoji: "💡",
        accent: "green",
        onClick: () => {
          location.hash = "#/health";
        }
      })
    );
    // 規劃食譜卡片
    container.appendChild(
      createCard({
        title: "規劃食譜",
        subtitle: "設定 → 產出食譜",
        emoji: "🗂️",
        accent: "orange",
        onClick: () => {
          location.hash = "#/plan";
        }
      })
    );

    pageContent.appendChild(container);
  }

  function renderRecords() {
    pageTitle.textContent = "我的紀錄";
    pageContent.innerHTML = "";
    const div = document.createElement("div");
    div.style.border = "1px solid #cbd5e1";
    div.style.borderRadius = "1rem";
    div.style.background = "white";
    div.style.padding = "1.5rem";
    div.style.color = "#64748b";
    div.style.textAlign = "center";
    div.textContent = "（此頁暫不實作，預留未來使用者紀錄區域）";
    pageContent.appendChild(div);
  }

  function renderHealthKnowledge() {
    pageTitle.textContent = "健康飲食｜小知識";
    pageContent.innerHTML = "";
    const knowledgeList = [
      {
        title: "原型食物 (Whole Food)",
        content: `
          <p><b>什麼是原型食物？</b><br>
          指看得出原本樣貌、未經深加工的食物。它們保留了最完整的營養素與纖維。</p>
          <ul style="padding-left: 1.2rem; margin-top: 0.5rem;">
            <li>✅ <b>推薦選擇：</b>地瓜、糙米、新鮮肉類、水煮蛋、各種蔬菜水果。</li>
            <li>❌ <b>避免加工：</b>熱狗、火腿、蛋糕、含糖飲料、罐頭食品。</li>
          </ul>
          <p style="margin-top: 0.5rem; color: #16a34a; font-weight: bold;">小撇步：逛超市時，多在「生鮮區」停留，少去「餅乾泡麵區」！</p>
        `
      },
      {
        title: "少油少鹽",
        content: `
          <p>現代人外食比例高，容易攝取過多的鈉與飽和脂肪，導致水腫與心血管負擔。</p>
          <ul style="padding-left: 1.2rem; margin-top: 0.5rem;">
            <li>🧂 <b>減鹽技巧：</b>多使用天然辛香料（蔥、薑、蒜、辣椒、檸檬）來提味，取代醬油膏或沙茶醬。</li>
            <li>🍳 <b>烹調方式：</b>優先選擇「蒸、煮、烤、燉」，避免「油炸、糖醋、勾芡」。</li>
          </ul>
          <p style="margin-top: 0.5rem;">💡 <i>習慣清淡口味後，你會更能吃出食材本身的鮮甜喔！</i></p>
        `
      },
      {
        title: "均衡餐盤 (211 餐盤)",
        content: `
          <p>不用斤斤計較卡路里，用「體積」來控制最簡單！推薦哈佛大學提出的健康餐盤概念。</p>
          <div style="background: #f0fdf4; padding: 10px; border-radius: 8px; margin-top: 10px;">
            <b>🥗 蔬菜佔 1/2：</b>每餐至少兩份拳頭大的蔬菜。<br>
            <b>🥩 蛋白質佔 1/4：</b>豆魚蛋肉類，約一個手掌心大小。<br>
            <b>🍚 澱粉佔 1/4：</b>優先選非精緻澱粉（如糙米、地瓜）。
          </div>
        `
      },
      {
        title: "低 GI 飲食",
        content: `
          <p><b>GI (升糖指數)</b> 代表食物造成血糖上升的速度。低 GI 食物能讓血糖穩定，減少飢餓感與脂肪堆積。</p>
          <ul style="padding-left: 1.2rem; margin-top: 0.5rem;">
            <li>🟢 <b>低 GI (55以下)：</b> 燕麥、蘋果、芭樂、無糖豆漿、葉菜類。</li>
            <li>🔴 <b>高 GI (70以上)：</b> 白吐司、西瓜、薯條、含糖飲料。</li>
          </ul>
          <p style="margin-top: 0.5rem;">⚠️ 注意：低 GI 不代表「低熱量」，過量食用一樣會胖喔！</p>
        `
      },
      {
        title: "水分與飲食",
        content: `
          <p>人體有 70% 是水做的，喝水能幫助代謝、排毒，甚至能增加飽足感！</p>
          <p><b>💧 我一天要喝多少水？</b><br>
          公式：<span style="color: #2563eb; font-weight: bold;">體重(kg) × 30~40cc</span>。</p>
          <p><i>例如：60公斤的人，一天建議喝 1800cc ~ 2400cc。</i></p>
          <p style="margin-top: 0.5rem;">❌ <b>茶與咖啡不算水：</b>它們有利尿作用，喝多了反而要補更多水。</p>
        `
      },
      {
        title: "運動與飲食",
        content: `
          <p>「三分練，七分吃」，但也別忽略運動帶來的代謝紅利！</p>
          <ul style="padding-left: 1.2rem; margin-top: 0.5rem;">
            <li>🏋️ <b>運動前：</b>吃點好消化的碳水（如香蕉），提供能量。</li>
            <li>🍗 <b>運動後：</b>30分鐘內補充「蛋白質 + 少量碳水」（如豆漿+地瓜），幫助肌肉修復。</li>
          </ul>
          <p style="margin-top: 0.5rem; color: #ea580c;">🔥 <b>迷思破解：</b>空腹運動燃脂效果不一定比較好，反而可能導致肌肉流失喔！</p>
        `
      }
    ];

    const grid = document.createElement("div");
    grid.className = "grid-2";
    knowledgeList.forEach(item => {
      const card = document.createElement("div");
      card.className = "card green";
      card.style.minHeight = "7.5rem";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.justifyContent = "center";
      card.style.cursor = "pointer";

      const titleDiv = document.createElement("div");
      titleDiv.style.fontWeight = "500";
      titleDiv.style.marginBottom = "0.5rem";
      titleDiv.textContent = item.title;

      const hintDiv = document.createElement("div");
      hintDiv.style.fontSize = "0.875rem";
      hintDiv.style.color = "#64748b";
      hintDiv.textContent = "點擊查看更多內容";

      card.appendChild(titleDiv);
      card.appendChild(hintDiv);

      card.addEventListener("click", () => showModal(item.title, item.content));

      grid.appendChild(card);
    });

    pageContent.appendChild(grid);
  }

  function renderHealthMap() {
    pageTitle.textContent = "健康飲食｜Food map";
    pageContent.innerHTML = "";

    const mapDiv = document.createElement("div");
    mapDiv.id = "food-map";
    mapDiv.style.width = "100%";
    mapDiv.style.height = "520px";
    mapDiv.style.border = "1px solid #cbd5e1";
    mapDiv.style.borderRadius = "1rem";
    mapDiv.style.overflow = "hidden";
    mapDiv.style.background = "white";

    pageContent.appendChild(mapDiv);

    // ✅ 如果 Google Maps 還沒載入，就顯示錯誤
    if (!window.google || !window.google.maps) {
      const warn = document.createElement("div");
      warn.style.marginTop = "1rem";
      warn.style.color = "#ef4444";
      warn.textContent = "Google Maps 尚未載入（API key 沒放、被限制、或網路問題）";
      pageContent.appendChild(warn);
      return;
    }

    // ✅ 初始化地圖（先隨便用基隆附近當中心）
    const map = new google.maps.Map(mapDiv, {
      center: { lat: 25.1514, lng: 121.7720 },
      zoom: 14,
    });

    // ✅ 從後端抓餐廳資料（你等等會做 /api/restaurants）
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then((json) => {
        const restaurants = json.restaurants || [];
        const bounds = new google.maps.LatLngBounds();

        restaurants.forEach((x) => {
          const pos = { lat: x.lat, lng: x.lng };
          bounds.extend(pos);

          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: x.name,
          });

          const info = new google.maps.InfoWindow();

          marker.addListener("click", async () => {
            // 先顯示 loading
            info.setContent(`<div style="font-weight:700">${x.name}</div><div>載入中…</div>`);
            info.open({ map, anchor: marker });

            try {
              const url = `${API_BASE}/api/restaurant-meals?lat=${encodeURIComponent(x.lat)}&lng=${encodeURIComponent(x.lng)}`;
              const res = await fetch(url);
              const json = await res.json();
              const meals = json.meals || [];

              // 組小卡內容（不要太長，先顯示前 8 筆）
              const listHtml = meals.slice(0, 8).map(m => `
                <div style="padding:6px 0; border-top:1px solid #e2e8f0;">
                  <div style="font-weight:600;">${m.name}</div>
                  <div style="font-size:12px; color:#64748b;">
                    ${m.kcal ?? "—"} kcal · $${m.price ?? "—"} · ${m.mealType ?? ""}
                  </div>
                  ${Array.isArray(m.tags) && m.tags.length
                    ? `<div style="font-size:12px; color:#16a34a;">${m.tags.join("、")}</div>`
                    : ""
                  }
                </div>
              `).join("");

              info.setContent(`
                <div style="min-width:240px; max-width:300px;">
                  <div style="font-weight:800; margin-bottom:6px;">${x.name}</div>
                  <div style="font-size:12px; color:#64748b; margin-bottom:6px;">
                    出現於 ${x.count ?? meals.length} 筆餐點
                  </div>
                  <div style="max-height:220px; overflow:auto;">
                    ${meals.length ? listHtml : `<div style="color:#64748b;">這家店目前沒有餐點資料</div>`}
                  </div>
                </div>
              `);
            } catch (err) {
              console.error(err);
              info.setContent(`<div style="font-weight:700">${x.name}</div><div style="color:#ef4444;">載入失敗</div>`);
            }
          });
        });

        if (restaurants.length) map.fitBounds(bounds);
      })
      .catch((err) => {
        console.error(err);
        const warn = document.createElement("div");
        warn.style.marginTop = "1rem";
        warn.style.color = "#ef4444";
        warn.textContent = "抓不到 /api/restaurants（後端還沒做或路徑不對）";
        pageContent.appendChild(warn);
      });
  }

  window.initMap = function () {
    // 如果你剛好在地圖頁，重新 render 一次確保 map init
    if ((location.hash || "") === "#/health/map") {
      renderHealthMap();
    }
  };

  function renderHealthHome() {
    pageTitle.textContent = "健康飲食";
    pageContent.innerHTML = "";

    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fit, minmax(240px, 1fr))";
    container.style.gap = "1rem";

    container.appendChild(
      createCard({
        title: "小知識",
        subtitle: "低GI、原型食物、飲食小技巧",
        emoji: "📚",
        accent: "green",
        onClick: () => (location.hash = "#/health/knowledge"),
      })
    );

    container.appendChild(
      createCard({
        title: "Food map",
        subtitle: "把資料庫餐廳標在地圖上",
        emoji: "🗺️",
        accent: "green",
        onClick: () => (location.hash = "#/health/map"),
      })
    );

    pageContent.appendChild(container);
  }


  function renderPlanHome() {
    pageTitle.textContent = "規劃食譜";
    pageContent.innerHTML = "";

    const container = document.createElement("div");
    container.className = "grid-2";

    container.appendChild(
      createCard({
        title: "設定",
        subtitle: "預算、每餐形式、一日熱量（先用占位框）",
        emoji: "⚙️",
        accent: "orange",
        onClick: () => {
          location.hash = "#/plan/settings";
        }
      })
    );
    container.appendChild(
      createCard({
        title: "食譜",
        subtitle: "顯示早餐／午餐／晚餐的推薦清單",
        emoji: "🍽️",
        accent: "orange",
        onClick: () => {
          location.hash = "#/plan/menu";
        }
      })
    );
    pageContent.appendChild(container);
  }

  function renderPlanSettings() {
    pageTitle.textContent = "規劃食譜｜設定";
    pageContent.innerHTML = "";

    const form = document.createElement("form");
    form.style.border = "1px dashed #cbd5e1";
    form.style.borderRadius = "1rem";
    form.style.background = "white";
    form.style.padding = "2rem 1rem";
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "2rem";

    // 第一橫排：三個預算
    const row1 = document.createElement("div");
    row1.className = "plan-row plan-row-1";
    row1.style.display = "flex";
    row1.style.gap = "2rem";
    ["早餐", "午餐", "晚餐"].forEach(meal => {
      const block = document.createElement("div");
      block.className = "plan-block plan-budget";
      block.style.flex = "1";
      block.style.display = "flex";
      block.style.flexDirection = "column";
      block.style.alignItems = "center";
      block.style.border = "1px dashed #cbd5e1";
      block.style.borderRadius = "1rem";
      block.style.padding = "1rem";
      block.style.fontSize = "1rem";
      block.style.color = "#334155";
      block.innerHTML = `<label for="${meal}Budget">${meal}預算（元）</label>`;
      const input = document.createElement("input");
      input.type = "number";
      input.id = `${meal}Budget`;
      input.name = `${meal}Budget`;
      input.placeholder = "請輸入金額";
      input.style.marginTop = "0.75rem";
      input.style.width = "100%";
      input.style.padding = "0.5rem";
      input.style.borderRadius = "0.5rem";
      input.style.border = "1px solid #cbd5e1";
      block.appendChild(input);
      row1.appendChild(block);
    });

    // 第二橫排：三個餐型（外食 / 自煮）
    const row2 = document.createElement("div");
    row1.className = "plan-row plan-row-2";
    row2.style.display = "flex";
    row2.style.gap = "2rem";
    ["早餐", "午餐", "晚餐"].forEach(meal => {
      const block = document.createElement("div");
      block.className = "plan-block plan-type";
      block.style.flex = "1";
      block.style.display = "flex";
      block.style.flexDirection = "column";
      block.style.alignItems = "center";
      block.style.border = "1px dashed #cbd5e1";
      block.style.borderRadius = "1rem";
      block.style.padding = "1rem";
      block.style.color = "#334155";
      block.innerHTML = `<label>${meal}形式</label>`;
      const group = document.createElement("div");
      group.style.marginTop = "0.75rem";
      group.style.display = "flex";
      group.style.gap = "1rem";

      ["外食", "自煮"].forEach(type => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = type;
        btn.style.padding = "0.5rem 1.5rem";
        btn.style.borderRadius = "0.5rem";
        btn.style.border = "none";
        btn.style.background = "#e2e8f0";
        btn.style.color = "#334155";
        btn.style.fontSize = "1rem";
        btn.className = "type-btn";
        btn.dataset.meal = meal;
        btn.dataset.value = type;
        group.appendChild(btn);
      });

      // 狀態管理：被選取時更換樣式
      group.addEventListener("click", e => {
        const target = e.target;
        if (target.classList.contains("type-btn")) {
          Array.from(group.children).forEach(x => x.classList.remove("selected"));
          target.classList.add("selected");
          target.style.background = "#16a34a";
          target.style.color = "#fff";
          Array.from(group.children).forEach(x => {
            if (!x.classList.contains("selected")) {
              x.style.background = "#e2e8f0";
              x.style.color = "#334155";
            }
          });
        }
      });

      block.appendChild(group);
      row2.appendChild(block);
    });

    // 第三橫排：卡路里 + 儲存鍵
    const row3 = document.createElement("div");
    row1.className = "plan-row plan-row-3";
    row3.style.display = "flex";
    row3.style.gap = "2rem";
    row3.style.alignItems = "center";

    const calBlock = document.createElement("div");
    calBlock.className = "plan-block plan-calorie";
    calBlock.style.flex = "2";
    calBlock.style.display = "flex";
    calBlock.style.flexDirection = "column";
    calBlock.style.alignItems = "center";
    calBlock.style.border = "1px dashed #cbd5e1";
    calBlock.style.borderRadius = "1rem";
    calBlock.style.padding = "1rem";
    calBlock.style.fontSize = "1rem";
    calBlock.style.color = "#334155";
    calBlock.innerHTML = `<label for="calorie">一天預計攝入的卡路里</label>`;
    const calorieInput = document.createElement("input");
    calorieInput.type = "number";
    calorieInput.id = "calorie";
    calorieInput.name = "calorie";
    calorieInput.placeholder = "請輸入熱量";
    calorieInput.style.marginTop = "0.75rem";
    calorieInput.style.width = "100%";
    calorieInput.style.padding = "0.5rem";
    calorieInput.style.borderRadius = "0.5rem";
    calorieInput.style.border = "1px solid #cbd5e1";
    calBlock.appendChild(calorieInput);

    const saveBlock = document.createElement("div");
    saveBlock.className = "plan-block plan-save";
    saveBlock.style.flex = "1";
    saveBlock.style.display = "flex";
    saveBlock.style.alignItems = "center";
    saveBlock.style.justifyContent = "center";
    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "btn";
    saveBtn.textContent = "儲存並產生食譜";
    saveBtn.style.width = "100%";
    saveBtn.style.height = "3rem";
    saveBtn.style.fontSize = "1.2rem";
    saveBlock.appendChild(saveBtn);

    row3.appendChild(calBlock);
    row3.appendChild(saveBlock);

    form.appendChild(row1);
    form.appendChild(row2);
    form.appendChild(row3);
    pageContent.appendChild(form);

    // ===== 這裡是儲存後真正要做的事 =====
    form.addEventListener("submit", async e => {
      e.preventDefault();

      const mealMap = {
        breakfast: "早餐",
        lunch: "午餐",
        dinner: "晚餐"
      };

      const budgets = {};
      const types = {};

      // 讀預算
      Object.entries(mealMap).forEach(([key, label]) => {
        const input = document.getElementById(`${label}Budget`);
        budgets[key] = input.value ? Number(input.value) : 0;
      });

      // 讀形式（外食 / 自煮），預設外食
      Object.entries(mealMap).forEach(([key, label]) => {
        const btns = form.querySelectorAll(
          `button.type-btn[data-meal="${label}"]`
        );
        let selected = "外食";
        btns.forEach(btn => {
          if (btn.classList.contains("selected")) {
            selected = btn.dataset.value;
          }
        });
        types[key] = selected;
      });

      const dailyKcal = calorieInput.value ? Number(calorieInput.value) : 0;

      if (!dailyKcal) {
        alert("請先輸入一天預計攝入的卡路里");
        return;
      }

      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            breakfastBudget: budgets.breakfast,
            lunchBudget: budgets.lunch,
            dinnerBudget: budgets.dinner,
            breakfastType: types.breakfast,
            lunchType: types.lunch,
            dinnerType: types.dinner,
            dailyCalorie: dailyKcal
          })

        });

        if (!res.ok) {
          throw new Error("伺服器回傳錯誤");
        }

        const json = await res.json();
        generatedPlan = json.plan; // ✅ 重點：只存 plan
        localStorage.setItem("generatedPlan", JSON.stringify(generatedPlan));
        location.hash = "#/plan/menu";
        localStorage.setItem("planSettings", JSON.stringify({ budgets, types, dailyKcal }));
        localStorage.setItem("excludeHistory", JSON.stringify([])); // ✅ 新產生就清空歷史


        console.log("json =", json);
        alert(JSON.stringify(json, null, 2));
      } catch (err) {
        console.error(err);
        alert("產生食譜失敗，等等再試一次 QQ");
      }
    });
  }

  function renderPlanMenu() {
      pageTitle.textContent = "規劃食譜｜食譜";
      pageContent.innerHTML = "";

      // ✅ 先拿到後端回傳的 plan
      const plan = generatedPlan || JSON.parse(localStorage.getItem("generatedPlan") || "null");
      generatedPlan = plan; // ✅ 讓 generatedPlan 永遠跟畫面一致

      if (!plan) {
        const tip = document.createElement("div");
        tip.style.background = "white";
        tip.style.border = "1px dashed #cbd5e1";
        tip.style.borderRadius = "1rem";
        tip.style.padding = "1.5rem";
        tip.textContent = "尚未產生食譜，請先回到設定頁按『儲存並產生食譜』。";
        pageContent.appendChild(tip);
        return;
      }

      const meals = ["早餐", "午餐", "晚餐"];
      const container = document.createElement("div");
      container.style.display = "grid";
      container.style.gridTemplateColumns = "repeat(auto-fit,minmax(250px,1fr))";
      container.style.gap = "1rem";

      meals.forEach(meal => {
        const data = plan[meal] || { items: [], totalKcal: 0 };

        const box = document.createElement("div");
        box.style.background = "white";
        box.style.border = "1px solid #cbd5e1";
        box.style.borderRadius = "1rem";
        box.style.padding = "1rem";

        const title = document.createElement("div");
        title.style.fontSize = "1.25rem";
        title.style.fontWeight = "700";
        title.style.marginBottom = "0.75rem";
        title.textContent = meal;
        box.appendChild(title);

        const ul = document.createElement("ul");
        ul.style.margin = "0";
        ul.style.paddingLeft = "1.2rem";

        if (data.items.length === 0) {
          const li = document.createElement("li");
          li.textContent = "（找不到符合條件的餐點）";
          ul.appendChild(li);
        } else {
          // ✅ 你要求：每餐 1 筆，這裡就畫 1 筆
          const f = data.items[0];
          const li = document.createElement("li");
          const r = f.restaurant;
          console.log(f);
          li.innerHTML = `
            <div>${f.name} - ${f.price}元 / ${f.kcal} kcal</div>
            <div style="margin-top:6px; font-size:0.95rem; color:#475569;">
              可購買：
              ${
                r?.address
                  ? `<a href="${r.address}" target="_blank" rel="noreferrer"
                      style="color:#2563eb; text-decoration:underline;">
                      ${r.name || "Google Map"}
                    </a>`
                  : (r?.name || "（未提供）")
              }
            </div>
          `;
          ul.appendChild(li);

          // address 先當連結占位
          if (f.address) {
            const addr = document.createElement("div");
            addr.style.marginTop = "0.5rem";
            addr.style.fontSize = "0.9rem";
            addr.style.color = "#2563eb";
            addr.textContent = `去哪裡買：${f.address}`;
            box.appendChild(addr);
          }
        }

      box.appendChild(ul);

      const kcalDiv = document.createElement("div");
      kcalDiv.style.marginTop = "0.75rem";
      kcalDiv.style.fontSize = "0.9rem";
      kcalDiv.style.color = "#64748b";
      kcalDiv.textContent = `總熱量：${data.totalKcal ?? 0} kcal`;
      box.appendChild(kcalDiv);

      container.appendChild(box);

      const swapBtn = document.createElement("button");
      swapBtn.textContent = "換一個";
      swapBtn.className = "btn";
      swapBtn.style.marginTop = "0.75rem";
      swapBtn.style.width = "100%";

      swapBtn.onclick = async () => {
        const settings = JSON.parse(localStorage.getItem("planSettings") || "null");
        // ✅ 確保 generatedPlan 不是 null
        if (!generatedPlan) {
          generatedPlan = JSON.parse(localStorage.getItem("generatedPlan") || "null");
        }
        if (!generatedPlan) {
          alert("找不到已產生的食譜，請先回設定頁重新產生一次");
          return;
        }

        if (!settings) {
          alert("找不到設定，請先回設定頁產生一次食譜");
          return;
        }

        const history = JSON.parse(localStorage.getItem("excludeHistory") || "[]");

        // 目前三餐正在用的 id（避免換到別餐正在用的）
        const currentId = generatedPlan?.[meal]?.items?.[0]?._id; // 只排自己這餐
        const excludeIds = Array.from(new Set([
          ...history,
          ...(currentId ? [currentId] : [])
        ]));

        const res = await fetch("/api/swap-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meal, // 這個 meal 變數是你 forEach(meal=>...) 的那個
            budgets: settings.budgets,
            types: settings.types,
            dailyKcal: settings.dailyKcal,
            excludeIds
          })
        });

        const json = await res.json();
        if (!json.ok || !json.item) {
          alert("換不到新的（通常是資料太少或條件太嚴）");
          return;
        }

        // 把舊的加入歷史，避免按兩次又回來
        const oldId = generatedPlan?.[meal]?.items?.[0]?._id;
        const nextHistory = Array.from(new Set([...history, ...(oldId ? [oldId] : [])]));
        localStorage.setItem("excludeHistory", JSON.stringify(nextHistory));

        // 更新那一餐
        generatedPlan[meal] = {
          items: [json.item],
          totalKcal: json.item.kcal || 0,
        };

        localStorage.setItem("generatedPlan", JSON.stringify(generatedPlan));

        renderPlanMenu();
      };

      box.appendChild(swapBtn);

    });

    pageContent.appendChild(container);
  }

  // 路由處理
  function routeChanged() {
    let hash = location.hash || "#/";
    // 簡單路由對應
    if (hash === "#/" || hash === "") {
      renderHome();
    } else if (hash === "#/records") {
      renderRecords();
    } else if (hash === "#/health/knowledge") {
      renderHealthKnowledge();
    } else if (hash === "#/plan") {
      renderPlanHome();
    } else if (hash === "#/plan/settings") {
      renderPlanSettings();
    } else if (hash === "#/plan/menu") {
      renderPlanMenu();
    } else if (hash === "#/health/map") {
      renderHealthMap();
    } else if (hash === "#/health") {
      renderHealthHome();
    } else {
      pageTitle.textContent = "頁面不存在";
      pageContent.textContent = "找不到該頁面";
    }
  }

  window.addEventListener("hashchange", routeChanged);
  window.addEventListener("load", routeChanged);
})();

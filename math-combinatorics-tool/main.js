/* ==========================================================================
   数学「場合の数」学習教材 JavaScriptエンジン (Phase 1)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM要素の取得 ---
    const patternSelect = document.getElementById('pattern-select');
    const paramN = document.getElementById('param-n');
    const paramR = document.getElementById('param-r');
    const valN = document.getElementById('val-n');
    const valR = document.getElementById('val-r');
    const groupR = document.getElementById('group-r');
    const nrSliders = document.getElementById('nr-sliders');
    const duplicateSettings = document.getElementById('duplicate-settings');
    const elementsPool = document.getElementById('elements-pool');
    const slotsArea = document.getElementById('slots-area');
    const mathFormula = document.getElementById('math-formula');
    const mathSteps = document.getElementById('math-steps');
    const explanationBody = document.getElementById('explanation-body');
    const patternsList = document.getElementById('patterns-list');
    const resultsCount = document.getElementById('results-count');
    const btnAnimate = document.getElementById('btn-animate');

    const dupCountInputs = {
        A: document.getElementById('dup-count-A'),
        B: document.getElementById('dup-count-B'),
        C: document.getElementById('dup-count-C'),
        D: document.getElementById('dup-count-D')
    };

    // --- 2. 状態管理変数 ---
    let currentPattern = 'p1'; // p1: 順列, p2: 同じものがある順列, p7: 組合せ
    let n = 4;
    let r = 3;
    let elementType = 'ball'; // ball, card, char
    let activePatterns = []; // 生成されたすべてのパターン
    let currentDisplayIndex = 0; // 現在可視化エリアに表示しているパターンのインデックス

    // 要素に割り当てるカラーと文字の定義
    const ELEMENT_DEFS = [
        { label: 'A', colorIdx: 0 },
        { label: 'B', colorIdx: 1 },
        { label: 'C', colorIdx: 2 },
        { label: 'D', colorIdx: 3 },
        { label: 'E', colorIdx: 4 },
        { label: 'F', colorIdx: 5 }
    ];

    // --- 3. 数学ユーティリティ関数 ---
    const factorial = (num) => {
        if (num <= 1) return 1;
        let res = 1;
        for (let i = 2; i <= num; i++) res *= i;
        return res;
    };

    const getnPr = (n, r) => {
        if (r > n || r < 0) return 0;
        return factorial(n) / factorial(n - r);
    };

    const getnCr = (n, r) => {
        if (r > n || r < 0) return 0;
        return factorial(n) / (factorial(r) * factorial(n - r));
    };

    // --- 4. コア計算とパターン生成ロジック ---

    // 順列の全列挙 (再帰)
    function getPermutations(arr, size) {
        const results = [];
        function permute(temp, remaining) {
            if (temp.length === size) {
                results.push([...temp]);
                return;
            }
            for (let i = 0; i < remaining.length; i++) {
                const nextTemp = [...temp, remaining[i]];
                const nextRemaining = remaining.filter((_, idx) => idx !== i);
                permute(nextTemp, nextRemaining);
            }
        }
        permute([], arr);
        return results;
    }

    // 組合せの全列挙 (再帰)
    function getCombinations(arr, size) {
        const results = [];
        function combine(temp, start) {
            if (temp.length === size) {
                results.push([...temp]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                combine([...temp, arr[i]], i + 1);
            }
        }
        combine([], 0);
        return results;
    }

    // 同じものがある順列の全列挙 (重複を弾きながら再帰)
    function getDuplicatePermutations(elementList) {
        const results = [];
        // 並び替える要素の文字配列を作成 (例: ['A', 'A', 'B', 'C'])
        const arr = [];
        elementList.forEach(item => {
            for (let i = 0; i < item.count; i++) {
                arr.push(item.label);
            }
        });

        function permuteUnique(temp, remaining) {
            if (remaining.length === 0) {
                results.push([...temp]);
                return;
            }
            const usedInThisDepth = new Set();
            for (let i = 0; i < remaining.length; i++) {
                if (usedInThisDepth.has(remaining[i])) continue;
                usedInThisDepth.add(remaining[i]);
                
                const nextTemp = [...temp, remaining[i]];
                const nextRemaining = remaining.filter((_, idx) => idx !== i);
                permuteUnique(nextTemp, nextRemaining);
            }
        }
        
        // 元の要素インデックスに対応したオブジェクト配列に変換して返すために、
        // 文字列として並び替えた後、元定義にマッピングし直す
        permuteUnique([], arr);

        return results.map(strArr => {
            return strArr.map(char => {
                return ELEMENT_DEFS.find(d => d.label === char);
            });
        });
    }

    // --- 5. UI更新 & 可視化処理 ---

    // パラメータスライダー・入力値の整合性チェック
    function syncParameters() {
        currentPattern = patternSelect.value;
        
        if (currentPattern === 'p2') {
            // 同じものがある順列の場合
            nrSliders.classList.add('hidden');
            duplicateSettings.classList.remove('hidden');
            
            // 各個数を合計して n とする
            let total = 0;
            const counts = [];
            Object.keys(dupCountInputs).forEach(key => {
                let val = parseInt(dupCountInputs[key].value) || 0;
                if (val < 0) val = 0;
                total += val;
                counts.push({ label: key, count: val });
            });

            // 合計値上限を6にする制限
            if (total > 6) {
                // はみ出た分を減らす
                let overflow = total - 6;
                Object.keys(dupCountInputs).forEach(key => {
                    if (overflow > 0) {
                        let val = parseInt(dupCountInputs[key].value) || 0;
                        if (val > 0) {
                            const reduce = Math.min(val, overflow);
                            dupCountInputs[key].value = val - reduce;
                            overflow -= reduce;
                        }
                    }
                });
                total = 6;
            }

            n = total;
            r = total; // 同じものがある順列では全要素を並べ替える前提とする
        } else {
            // 基本順列または組合せの場合
            nrSliders.classList.remove('hidden');
            duplicateSettings.classList.add('hidden');
            
            n = parseInt(paramN.value);
            r = parseInt(paramR.value);

            // r が n を超えないように制御
            if (r > n) {
                r = n;
                paramR.value = n;
            }
            paramR.max = n;

            valN.textContent = n;
            valR.textContent = r;
        }

        // ラジオボタンの取得
        elementType = document.querySelector('input[name="element-type"]:checked').value;

        calculateAndDisplay();
    }

    // 計算と結果のレンダリング
    function calculateAndDisplay() {
        patternsList.innerHTML = '';
        currentDisplayIndex = 0;

        // 1. 対象の要素プールを定義 (n個の要素)
        let elementPoolList = [];
        if (currentPattern === 'p2') {
            // 同じものがある順列
            Object.keys(dupCountInputs).forEach(key => {
                const count = parseInt(dupCountInputs[key].value) || 0;
                const def = ELEMENT_DEFS.find(d => d.label === key);
                if (def && count > 0) {
                    elementPoolList.push({ ...def, count: count });
                }
            });
        } else {
            // 基本順列・組合せ (A, B, C, D...)
            for (let i = 0; i < n; i++) {
                elementPoolList.push(ELEMENT_DEFS[i]);
            }
        }

        // 2. パターン全列挙の実行
        if (currentPattern === 'p1') {
            // 基本の順列 (nPr)
            activePatterns = getPermutations(elementPoolList, r);
        } else if (currentPattern === 'p2') {
            // 同じものがある順列
            activePatterns = getDuplicatePermutations(elementPoolList);
        } else if (currentPattern === 'p7') {
            // 基本の組合せ (nCr)
            activePatterns = getCombinations(elementPoolList, r);
        }

        resultsCount.textContent = activePatterns.length;

        // 3. 数式と解説の生成
        renderFormulaAndExplanation(elementPoolList);

        // 4. パターン一覧グリッドのレンダリング
        if (activePatterns.length === 0) {
            patternsList.innerHTML = '<p class="help-text">要素を選択してください。</p>';
            slotsArea.innerHTML = '';
            elementsPool.innerHTML = '';
            return;
        }

        activePatterns.forEach((pattern, index) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            if (index === 0) item.classList.add('active-pattern');
            
            // 小さな丸や文字の並びでリストに描画
            const seqDiv = document.createElement('div');
            seqDiv.className = 'pattern-sequence';
            
            pattern.forEach(elem => {
                if (elementType === 'ball') {
                    const dot = document.createElement('div');
                    dot.className = `seq-dot color-${elem.colorIdx}`;
                    dot.textContent = elem.label;
                    seqDiv.appendChild(dot);
                } else {
                    const txt = document.createElement('span');
                    txt.className = 'pattern-text-seq';
                    txt.style.color = `var(--accent-cyan)`;
                    if (elem.colorIdx === 0) txt.style.color = '#ef4444';
                    if (elem.colorIdx === 1) txt.style.color = '#3b82f6';
                    if (elem.colorIdx === 2) txt.style.color = '#eab308';
                    if (elem.colorIdx === 3) txt.style.color = '#10b981';
                    txt.textContent = elem.label;
                    seqDiv.appendChild(txt);
                }
            });

            const idxSpan = document.createElement('span');
            idxSpan.className = 'pattern-index';
            idxSpan.textContent = `#${index + 1}`;

            item.appendChild(seqDiv);
            item.appendChild(idxSpan);

            item.addEventListener('click', () => {
                // クリックされたパターンを可視化エリアに配置
                document.querySelectorAll('.pattern-item').forEach(el => el.classList.remove('active-pattern'));
                item.classList.add('active-pattern');
                currentDisplayIndex = index;
                renderVisualization(pattern, elementPoolList);
            });

            patternsList.appendChild(item);
        });

        // 初回可視化レンダリング (インデックス0番目)
        renderVisualization(activePatterns[0], elementPoolList);
    }

    // 数式・解説の描画
    function renderFormulaAndExplanation(poolList) {
        if (currentPattern === 'p1') {
            // 順列
            const count = getnPr(n, r);
            mathFormula.innerHTML = `\\( _{${n}}P_{${r}} = ${count} \\)`;
            
            let steps = `${n}`;
            for (let i = 1; i < r; i++) {
                steps += ` \\times ${n - i}`;
            }
            if (r === 0) steps = '1';
            mathSteps.innerHTML = `${r}個並べる: ${steps} = ${count} 通り`;

            explanationBody.innerHTML = `
                <p><strong>基本の順列 ($_nP_r$)</strong>は、異なる $n$ 個のものから異なる $r$ 個を選んで、<strong>順番を区別して</strong>一列に並べる並べ方です。</p>
                <p>1つ目の位置に入るのは <code>${n}</code> 通り、2つ目は残りの <code>${n-1}</code> 通り... という風に、順に <code>r</code> 個掛け合わせます。</p>
            `;
        } else if (currentPattern === 'p2') {
            // 同じものがある順列
            let totalFact = factorial(n);
            let denomStr = '';
            let denomVal = 1;
            const counts = [];
            
            poolList.forEach(item => {
                if (item.count > 0) {
                    denomStr += `${item.count}! \\times `;
                    denomVal *= factorial(item.count);
                    counts.push(`${item.label}:${item.count}個`);
                }
            });
            if (denomStr.endsWith(' \\times ')) {
                denomStr = denomStr.slice(0, -9);
            }
            if (denomStr === '') {
                denomStr = '1';
            }

            const count = factorial(n) / denomVal;
            mathFormula.innerHTML = `\\( \\frac{${n}!}{${denomStr}} = \\frac{${totalFact}}{${denomVal}} = ${count} \\)`;
            mathSteps.innerHTML = `総数 ${n} 個の階乗を、重複要素の個数の階乗で割る: ${count} 通り`;

            explanationBody.innerHTML = `
                <p><strong>同じものがある順列</strong>では、一度すべての要素を「区別できる」と仮定して <code>n!</code> 通りの並べ方を考えます。</p>
                <p>その後、区別のつかない要素（例えば A が 2個なら <code>2!</code> 通り）の並べ替え分だけ重複して数えているため、その階乗で割り算して調整を行います。</p>
                <p>現在の設定要素: <code>${counts.join(', ')}</code> (合計 $n = ${n}$ 個)</p>
            `;
        } else if (currentPattern === 'p7') {
            // 組合せ
            const count = getnCr(n, r);
            mathFormula.innerHTML = `\\( _{${n}}C_{${r}} = \\frac{_{${n}}P_{${r}}}{${r}!} = \\frac{${getnPr(n, r)}}{${factorial(r)}} = ${count} \\)`;
            
            let numStr = `${n}`;
            let denStr = `${r}`;
            for (let i = 1; i < r; i++) {
                numStr += ` \\times ${n - i}`;
                denStr += ` \\times ${r - i}`;
            }
            if (r === 0) { numStr = '1'; denStr = '1'; }
            mathSteps.innerHTML = `分母も分子も ${r} 個の掛け算: \\( \\frac{${numStr}}{${denStr}} = ${count} \\) 通り`;

            explanationBody.innerHTML = `
                <p><strong>組合せ ($_nC_r$)</strong>は、異なる $n$ 個のものから $r$ 個を<strong>順序を無視して（グループとして）</strong>選ぶ選び方です。</p>
                <p>一度順列として $r$ 個並べた数 ($_nP_r$) を求めた後、選んだ $r$ 個の並べ替え順数 <code>r!</code> 通りには区別がつかないため、<code>r!</code> で割り算します。</p>
            `;
        }

        // LaTeX の再読み込み（もしあれば）
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    // 可視化エリアに要素を配置
    function renderVisualization(pattern, poolList) {
        elementsPool.innerHTML = '';
        slotsArea.innerHTML = '';

        if (!pattern) return;

        // 1. プールエリア（選ばれる元の全要素）を描画
        // 重複ありの場合は、重複を含めたフラットなリストにする
        let flatPool = [];
        if (currentPattern === 'p2') {
            poolList.forEach(item => {
                for (let i = 0; i < item.count; i++) {
                    flatPool.push({ label: item.label, colorIdx: item.colorIdx });
                }
            });
        } else {
            flatPool = [...poolList];
        }

        flatPool.forEach((elem, index) => {
            const el = document.createElement('div');
            el.className = `visual-element type-${elementType} color-${elem.colorIdx}`;
            el.textContent = elem.label;
            el.id = `pool-elem-${index}`;
            elementsPool.appendChild(el);
        });

        // 2. スロットエリア（選ばれた要素の枠）を描画
        const slotCount = (currentPattern === 'p2') ? n : r;
        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot-box';
            slot.setAttribute('data-slot-num', i + 1);
            slot.id = `slot-${i}`;
            slotsArea.appendChild(slot);
        }

        // 3. すでに選択されている状態として、要素をスロット内にレンダリング
        pattern.forEach((elem, slotIdx) => {
            const slot = document.getElementById(`slot-${slotIdx}`);
            if (slot) {
                const el = document.createElement('div');
                el.className = `visual-element type-${elementType} color-${elem.colorIdx}`;
                el.style.transform = 'scale(0.9)';
                el.textContent = elem.label;
                slot.appendChild(el);
            }
        });
    }

    // アニメーション再生（プールからスロットへ順に吸い込まれる）
    function playTransition() {
        const pattern = activePatterns[currentDisplayIndex];
        if (!pattern) return;

        // 一旦スロット内を空にして枠だけにする
        const slotCount = (currentPattern === 'p2') ? n : r;
        slotsArea.innerHTML = '';
        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot-box';
            slot.setAttribute('data-slot-num', i + 1);
            slot.id = `slot-${i}`;
            slotsArea.appendChild(slot);
        }

        // プールを再描画（すべて元の位置に戻す）
        calculateAndDisplayOnlyPool();

        btnAnimate.disabled = true;
        btnAnimate.textContent = '計算中...';

        // 1つずつプールから対応する要素を探してスロットへ移動させる
        let step = 0;
        
        function animateNextStep() {
            if (step >= pattern.length) {
                btnAnimate.disabled = false;
                btnAnimate.textContent = '並び替えを再生';
                return;
            }

            const targetElem = pattern[step];
            const targetSlot = document.getElementById(`slot-${step}`);

            // プールエリアから、まだ使われていない同じ種類の要素を探す
            const poolElements = Array.from(elementsPool.children);
            let matchedEl = null;

            for (let el of poolElements) {
                // ラベルが一致し、まだ移動アニメーションが適用されていないもの
                if (el.textContent === targetElem.label && !el.classList.contains('moved')) {
                    matchedEl = el;
                    break;
                }
            }

            if (matchedEl && targetSlot) {
                matchedEl.classList.add('moved');
                
                // 位置（座標）を計算
                const poolRect = matchedEl.getBoundingClientRect();
                const slotRect = targetSlot.getBoundingClientRect();

                const dX = slotRect.left - poolRect.left;
                const dY = slotRect.top - poolRect.top;

                // スムーズな移動アニメーション
                matchedEl.style.transform = `translate(${dX}px, ${dY}px) scale(0.95)`;
                
                // アニメーション完了後にスロットに正式配置
                setTimeout(() => {
                    matchedEl.style.opacity = '0'; // プール側は消す
                    
                    const finalEl = document.createElement('div');
                    finalEl.className = `visual-element type-${elementType} color-${targetElem.colorIdx}`;
                    finalEl.style.transform = 'scale(0.9)';
                    finalEl.style.opacity = '0';
                    finalEl.style.transition = 'opacity 0.2s ease';
                    finalEl.textContent = targetElem.label;
                    
                    targetSlot.appendChild(finalEl);
                    
                    // スロット内でふわっと表示
                    requestAnimationFrame(() => {
                        finalEl.style.opacity = '1';
                    });

                    step++;
                    animateNextStep();
                }, 400); // 400msかけて移動
            } else {
                // 万が一見つからなければスキップ
                step++;
                animateNextStep();
            }
        }

        animateNextStep();
    }

    // アニメーション用にプールのみをリセット・描画する関数
    function calculateAndDisplayOnlyPool() {
        elementsPool.innerHTML = '';
        let elementPoolList = [];
        if (currentPattern === 'p2') {
            Object.keys(dupCountInputs).forEach(key => {
                const count = parseInt(dupCountInputs[key].value) || 0;
                const def = ELEMENT_DEFS.find(d => d.label === key);
                if (def && count > 0) {
                    elementPoolList.push({ ...def, count: count });
                }
            });
        } else {
            for (let i = 0; i < n; i++) {
                elementPoolList.push(ELEMENT_DEFS[i]);
            }
        }

        let flatPool = [];
        if (currentPattern === 'p2') {
            elementPoolList.forEach(item => {
                for (let i = 0; i < item.count; i++) {
                    flatPool.push({ label: item.label, colorIdx: item.colorIdx });
                }
            });
        } else {
            flatPool = [...elementPoolList];
        }

        flatPool.forEach((elem, index) => {
            const el = document.createElement('div');
            el.className = `visual-element type-${elementType} color-${elem.colorIdx}`;
            el.textContent = elem.label;
            el.id = `pool-elem-${index}`;
            elementsPool.appendChild(el);
        });
    }


    // --- 6. イベントリスナーの設定 ---
    patternSelect.addEventListener('change', syncParameters);
    paramN.addEventListener('input', syncParameters);
    paramR.addEventListener('input', syncParameters);
    
    Object.keys(dupCountInputs).forEach(key => {
        dupCountInputs[key].addEventListener('change', syncParameters);
    });

    document.querySelectorAll('input[name="element-type"]').forEach(radio => {
        radio.addEventListener('change', syncParameters);
    });

    btnAnimate.addEventListener('click', playTransition);

    // ロックされたタブのクリック制御
    document.querySelectorAll('.nav-tab.locked').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            alert('このテーマは後続フェーズでアンロックされます。まずは基本の順列・組合せの学習から進めましょう！(=^・^=)');
        });
    });

    // --- 7. 初期化実行 ---
    syncParameters();
});

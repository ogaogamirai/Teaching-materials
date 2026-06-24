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
            mathSteps.innerHTML = `${r}個並べる: \\( ${steps} = ${count} \\) 通り`;

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
            mathSteps.innerHTML = `総数 \\( ${n} \\) 個の階乗を、重複要素の個数の階乗で割る: \\( ${count} \\) 通り`;

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

        // LaTeX の再読み込み（指定要素のみ再スキャンすることで高速化）
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([mathFormula, mathSteps, explanationBody]).catch(err => console.log(err));
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

    // ==========================================================================
    // --- Phase 2: 円順列・数珠順列・隣接制限の実装 ---
    // ==========================================================================

    // 1. Phase 2 用のDOM要素取得
    const patternSelectCirc = document.getElementById('pattern-select-circ');
    const paramCircN = document.getElementById('param-circ-n');
    const valCircN = document.getElementById('val-circ-n');
    const circParams = document.getElementById('circ-params');
    const adjParams = document.getElementById('adj-params');
    const paramAdjM = document.getElementById('param-adj-m');
    const valAdjM = document.getElementById('val-adj-m');
    const paramAdjW = document.getElementById('param-adj-w');
    const valAdjW = document.getElementById('val-adj-w');
    const btnAnimateCirc = document.getElementById('btn-animate-circ');
    const btnRotateCirc = document.getElementById('btn-rotate-circ');
    const btnFlipCirc = document.getElementById('btn-flip-circ');
    const elementsContainerCirc = document.getElementById('elements-container-circ');
    const mathFormulaCirc = document.getElementById('math-formula-circ');
    const mathStepsCirc = document.getElementById('math-steps-circ');
    const explanationBodyCirc = document.getElementById('explanation-body-circ');
    const patternsListCirc = document.getElementById('patterns-list-circ');
    const resultsCountCirc = document.getElementById('results-count-circ');

    // Phase 2 の状態
    let currentPatternCirc = 'p4';
    let circN = 4;
    let adjM = 5;
    let adjW = 3;
    let activePatternsCirc = [];
    let currentDisplayIndexCirc = 0;
    let isCircRotating = false;
    let isCircFlipped = false;

    // 円順列のシグネチャ（巡回シフトのうち辞書順で最小のものを代表値とする）
    function getCircularSignature(seq) {
        const n = seq.length;
        let minStr = null;
        let bestOffset = 0;
        
        for (let i = 0; i < n; i++) {
            const shifted = [];
            for (let j = 0; j < n; j++) {
                shifted.push(seq[(i + j) % n].label);
            }
            const str = shifted.join('');
            if (minStr === null || str < minStr) {
                minStr = str;
                bestOffset = i;
            }
        }
        
        // 辞書順最小の巡回シフトをした配列を返す
        const result = [];
        for (let j = 0; j < n; j++) {
            result.push(seq[(bestOffset + j) % n]);
        }
        return { sig: minStr, seq: result };
    }

    // 数珠順列のシグネチャ（巡回シフト＋反転のうち辞書順最小のものを代表値とする）
    function getBeadSignature(seq) {
        const n = seq.length;
        let minStr = null;
        let bestSeq = null;
        
        // 通常の巡回
        for (let i = 0; i < n; i++) {
            const shifted = [];
            for (let j = 0; j < n; j++) {
                shifted.push(seq[(i + j) % n].label);
            }
            const str = shifted.join('');
            if (minStr === null || str < minStr) {
                minStr = str;
                const tempSeq = [];
                for (let j = 0; j < n; j++) tempSeq.push(seq[(i + j) % n]);
                bestSeq = tempSeq;
            }
        }
        
        // 反転（リバース）して巡回
        const rev = [...seq].reverse();
        for (let i = 0; i < n; i++) {
            const shifted = [];
            for (let j = 0; j < n; j++) {
                shifted.push(rev[(i + j) % n].label);
            }
            const str = shifted.join('');
            if (minStr === null || str < minStr) {
                minStr = str;
                const tempSeq = [];
                for (let j = 0; j < n; j++) tempSeq.push(rev[(i + j) % n]);
                bestSeq = tempSeq;
            }
        }
        
        return { sig: minStr, seq: bestSeq };
    }

    // 与えられた要素から、円順列を抽出（重複排除）
    function generateCircularPermutations(elements) {
        const allPerms = getPermutations(elements, elements.length);
        const seen = new Set();
        const results = [];
        
        allPerms.forEach(perm => {
            const { sig, seq } = getCircularSignature(perm);
            if (!seen.has(sig)) {
                seen.add(sig);
                results.push(seq);
            }
        });
        return results;
    }

    // 与えられた要素から、数珠順列を抽出（重複排除）
    function generateBeadPermutations(elements) {
        const allPerms = getPermutations(elements, elements.length);
        const seen = new Set();
        const results = [];
        
        allPerms.forEach(perm => {
            const { sig, seq } = getBeadSignature(perm);
            if (!seen.has(sig)) {
                seen.add(sig);
                results.push(seq);
            }
        });
        return results;
    }

    // 隣接制限: 全列挙
    function generateAdjacentPermutations(mCount, wCount, type) {
        // M1, M2... W1, W2... のオブジェクトリストを作成
        const elements = [];
        for (let i = 1; i <= mCount; i++) {
            elements.push({ label: `M${i}`, colorIdx: 1, type: 'M' }); // 男子: 青
        }
        for (let i = 1; i <= wCount; i++) {
            elements.push({ label: `W${i}`, colorIdx: 0, type: 'W' }); // 女子: 赤/ピンク
        }

        const allPerms = getPermutations(elements, elements.length);
        const results = [];

        allPerms.forEach(perm => {
            if (type === 'adjacent') {
                // Wが全員隣り合っているかチェック
                // 最初のWと最後のWのインデックスの間にMが挟まれていないか
                const wIndices = [];
                perm.forEach((item, idx) => {
                    if (item.type === 'W') wIndices.push(idx);
                });
                const isAdj = (wIndices[wIndices.length - 1] - wIndices[0] === wCount - 1);
                if (isAdj) results.push(perm);
            } else {
                // Wがどの2人も隣り合わないかチェック
                let prevType = '';
                let isValid = true;
                for (let i = 0; i < perm.length; i++) {
                    if (perm[i].type === 'W' && prevType === 'W') {
                        isValid = false;
                        break;
                    }
                    prevType = perm[i].type;
                }
                if (isValid) results.push(perm);
            }
        });

        return results;
    }

    // --- Phase 2 パラメータ同期 ---
    function syncParametersCirc() {
        currentPatternCirc = patternSelectCirc.value;
        
        // UI表示切り替え
        if (currentPatternCirc.startsWith('p13')) {
            // 隣接制限の場合
            circParams.classList.add('hidden');
            adjParams.classList.remove('hidden');
            
            adjM = parseInt(paramAdjM.value);
            adjW = parseInt(paramAdjW.value);
            valAdjM.textContent = adjM;
            valAdjW.textContent = adjW;

            btnRotateCirc.classList.add('hidden');
            btnFlipCirc.classList.add('hidden');
        } else {
            // 円順列・数珠順列の場合
            circParams.classList.remove('hidden');
            adjParams.classList.add('hidden');
            
            circN = parseInt(paramCircN.value);
            valCircN.textContent = circN;

            btnRotateCirc.classList.remove('hidden');
            if (currentPatternCirc === 'p6') {
                btnFlipCirc.classList.remove('hidden');
            } else {
                btnFlipCirc.classList.add('hidden');
            }
        }

        // アニメーションステートのリセット
        elementsContainerCirc.classList.remove('rotating');
        elementsContainerCirc.classList.remove('flipping');
        isCircRotating = false;
        isCircFlipped = false;
        btnRotateCirc.textContent = '回転を確認';
        btnFlipCirc.textContent = '裏返しを確認';

        calculateAndDisplayCirc();
    }

    // --- Phase 2 計算・表示 ---
    function calculateAndDisplayCirc() {
        patternsListCirc.innerHTML = '';
        elementsContainerCirc.innerHTML = '';
        currentDisplayIndexCirc = 0;

        let elementPool = [];
        
        // 1. パターンの計算と全列挙
        if (currentPatternCirc === 'p4') {
            // 基本の円順列
            for (let i = 0; i < circN; i++) {
                elementPool.push(ELEMENT_DEFS[i]);
            }
            activePatternsCirc = generateCircularPermutations(elementPool);
        } else if (currentPatternCirc === 'p5') {
            // 同じものがある円順列
            // 設計書に基づき、要素構成 A,A,B,B,C,C 固定とする (n=6)
            elementPool = [
                { label: 'A', colorIdx: 0 },
                { label: 'A', colorIdx: 0 },
                { label: 'B', colorIdx: 1 },
                { label: 'B', colorIdx: 1 },
                { label: 'C', colorIdx: 2 },
                { label: 'C', colorIdx: 2 }
            ];
            activePatternsCirc = generateCircularPermutations(elementPool);
        } else if (currentPatternCirc === 'p6') {
            // 数珠順列
            // 赤玉と白玉の組み合わせ（例：白6、赤3の合計9個、あるいはn個の異なる玉）
            // ここでは理解しやすいよう、異なるn個の玉を数珠にする問題として処理
            for (let i = 0; i < circN; i++) {
                elementPool.push(ELEMENT_DEFS[i]);
            }
            activePatternsCirc = generateBeadPermutations(elementPool);
        } else if (currentPatternCirc === 'p13-1') {
            // 隣り合う
            activePatternsCirc = generateAdjacentPermutations(adjM, adjW, 'adjacent');
        } else if (currentPatternCirc === 'p13-2') {
            // 隣り合わない
            activePatternsCirc = generateAdjacentPermutations(adjM, adjW, 'not_adjacent');
        }

        resultsCountCirc.textContent = activePatternsCirc.length;

        // 2. 数式と解説のレンダリング
        renderFormulaAndExplanationCirc();

        // 3. 全パターンリストの描画
        if (activePatternsCirc.length === 0) {
            patternsListCirc.innerHTML = '<p class="help-text">条件を設定してください。</p>';
            return;
        }

        // リスト描画（上限200件でクリップしてフリーズ防止）
        const displayLimit = 200;
        const displayCount = Math.min(activePatternsCirc.length, displayLimit);

        for (let index = 0; index < displayCount; index++) {
            const pattern = activePatternsCirc[index];
            const item = document.createElement('div');
            item.className = 'pattern-item';
            if (index === 0) item.classList.add('active-pattern');

            const seqDiv = document.createElement('div');
            seqDiv.className = 'pattern-sequence';

            pattern.forEach(elem => {
                const dot = document.createElement('div');
                // 隣接制限の場合は M / W に応じたクラス
                if (currentPatternCirc.startsWith('p13')) {
                    dot.className = `seq-dot gender-${elem.type}`;
                } else {
                    dot.className = `seq-dot color-${elem.colorIdx}`;
                }
                dot.textContent = elem.label;
                seqDiv.appendChild(dot);
            });

            const idxSpan = document.createElement('span');
            idxSpan.className = 'pattern-index';
            idxSpan.textContent = `#${index + 1}`;

            item.appendChild(seqDiv);
            item.appendChild(idxSpan);

            item.addEventListener('click', () => {
                document.querySelectorAll('#patterns-list-circ .pattern-item').forEach(el => el.classList.remove('active-pattern'));
                item.classList.add('active-pattern');
                currentDisplayIndexCirc = index;
                renderVisualizationCirc(pattern);
            });

            patternsListCirc.appendChild(item);
        }

        if (activePatternsCirc.length > displayLimit) {
            const moreItem = document.createElement('div');
            moreItem.className = 'help-text';
            moreItem.style.gridColumn = '1 / -1';
            moreItem.style.textAlign = 'center';
            moreItem.style.padding = '0.5rem';
            moreItem.textContent = `...他 ${activePatternsCirc.length - displayLimit} 通りは省略 (総数 ${activePatternsCirc.length} 通り)`;
            patternsListCirc.appendChild(moreItem);
        }

        // 初回可視化レンダリング
        renderVisualizationCirc(activePatternsCirc[0]);
    }

    // --- Phase 2 数式・解説 ---
    function renderFormulaAndExplanationCirc() {
        if (currentPatternCirc === 'p4') {
            const count = factorial(circN - 1);
            mathFormulaCirc.innerHTML = `\\( (n-1)! = (${circN}-1)! = ${circN - 1}! = ${count} \\)`;
            mathStepsCirc.innerHTML = `特定の1人を固定し、残りの ${circN - 1} 人を一列に並べる: \\( ${circN - 1}! = ${count} \\) 通り`;
            explanationBodyCirc.innerHTML = `
                <p><strong>基本の円順列</strong>は、要素を円形に並べたとき、<strong>回転して同じになる並び方を同一視</strong>します。</p>
                <p>回転による重複を除くため、<strong>「特定の1つの要素をスタート地点（基準）に固定する」</strong>という考え方をします。基準を固定すると、残りの <code>(n-1)</code> 個を一列に並べる問題と同じになります。</p>
                <p>別の解法として、通常の順列 <code>n!</code> を周期（要素数）<code>n</code> で割ることでも算出できます: <code>n! ÷ n = (n-1)!</code></p>
            `;
        } else if (currentPatternCirc === 'p5') {
            // 同じものがある円順列 (A,A,B,B,C,C)
            // 設計書: ① 順列 6!/(2!2!2!) = 90
            // ② 例外的周期 (ABCABCなど) = 3! = 6
            // ③ 原則的周期円順列: (90 - 6) / 6 = 14
            // 例外的周期円順列: 6 / 3 = 2
            // 円順列合計 = 14 + 2 = 16
            mathFormulaCirc.innerHTML = `\\( \\text{原則周期分: } \\frac{90 - 6}{6} + \\text{例外周期分: } \\frac{6}{3} = 14 + 2 = 16 \\) 通り`;
            mathStepsCirc.innerHTML = `総順列 90 通りの中に、周期3の例外パターンが 6 通り含まれる`;
            explanationBodyCirc.innerHTML = `
                <p><strong>同じものがある円順列 (A,A,B,B,C,C)</strong>では、単純に割り算ができません。なぜなら、回転したときの周期が異なるパターンが混在するからです。</p>
                <p>① まず通常の順列の数を求めます: <code>6! ÷ (2!2!2!) = 90</code> 通り</p>
                <p>② 次に「短い周期で元に戻る例外パターン」を調べます。今回は要素数(2,2,2)の公約数2があるため、<code>ABCABC</code> のような<strong>周期3</strong>の並びが存在し、その順列は <code>3! = 6</code> 通りです。</p>
                <p>③ 重複調整:
                   <ul>
                     <li>原則的な周期6の並び: <code>(90 - 6) ÷ 6 = 14</code> 通り</li>
                     <li>例外的な周期3の並び: <code>6 ÷ 3 = 2</code> 通り</li>
                   </ul>
                   これらを足し合わせて、<code>14 + 2 = 16</code> 通りになります。</p>
            `;
        } else if (currentPatternCirc === 'p6') {
            // 数珠順列
            const circCount = factorial(circN - 1);
            // 異なるn個の玉の数珠順列は、円順列 (n-1)! を 2 で割る。
            // (今回はすべて異なる要素なので、左右対称な円順列は存在しない)
            const count = circCount / 2;
            mathFormulaCirc.innerHTML = `\\( \\frac{(n-1)!}{2} = \\frac{(${circN}-1)!}{2} = \\frac{${circCount}}{2} = ${count} \\) 通り`;
            mathStepsCirc.innerHTML = `円順列 ${circCount} 通りを、裏返しの重複分 2 で割る: ${count} 通り`;
            explanationBodyCirc.innerHTML = `
                <p><strong>数珠順列（じゅず・ネックレス）</strong>は、円順列をさらに<strong>立体的に裏返して同じになるものを同一視</strong>します。</p>
                <p>裏返す（表と裏）ことによる <code>2</code> 通りの重複があるため、基本的には円順列の数を <code>2</code> で割ります。</p>
                <p>※同じものを含む玉から数珠を作る場合は、「円順列の中で左右対称なもの」は裏返しても自分自身と同じなため2で割らず、「非対称なもの」だけを2で割るという高度な調整が必要になります（設計書の白6・赤3モデルなど）。</p>
            `;
        } else if (currentPatternCirc === 'p13-1') {
            // 隣り合う
            // (M + 1)! * W!
            const groupFact = factorial(adjM + 1);
            const wFact = factorial(adjW);
            const count = groupFact * wFact;
            
            mathFormulaCirc.innerHTML = `\\( (M + 1)! \\times W! = (${adjM}+1)! \\times ${adjW}! = ${adjM+1}! \\times ${wFact} = ${count} \\) 通り`;
            mathStepsCirc.innerHTML = `全体を ${adjM+1} つのまとまりとみる: \\( ${adjM+1}! \\) \\( \\times \\) 女子 ${adjW} 人の順列: \\( ${adjW}! \\) = ${count} 通り`;
            explanationBodyCirc.innerHTML = `
                <p><strong>隣り合う</strong>条件の並べ方では、<strong>「隣り合う要素（今回は女子 ${adjW} 人）を大きな1つのまとまり（1つの要素）とみなす」</strong>のが鉄則です。</p>
                <p>① 男子 <code>${adjM}</code> 人と「女子のまとまり 1つ」を合わせた、合計 <code>${adjM+1}</code> 要素を一列に並べます: <code>(M+1)!</code> 通り</p>
                <p>② まとまりの内部で、女子 <code>${adjW}</code> 人が並び替える方法を掛け合わせます: <code>W!</code> 通り</p>
                <p>これらを掛け算して、<code>(M+1)! × W!</code> になります。</p>
            `;
        } else if (currentPatternCirc === 'p13-2') {
            // 隣り合わない
            // M! * nPr(M+1, W)
            const mFact = factorial(adjM);
            const spaces = adjM + 1;
            const pVal = getnPr(spaces, adjW);
            const count = mFact * pVal;

            mathFormulaCirc.innerHTML = `\\( M! \\times {}_{M+1}P_{W} = ${adjM}! \\times {}_{${spaces}}P_{${adjW}} = ${mFact} \\times ${pVal} = ${count} \\) 通り`;
            mathStepsCirc.innerHTML = `男子の順列: \\( ${adjM}! \\) \\( \\times \\) 隙間 ${spaces} 箇所に女子 ${adjW} 人を入れる: \\( {}_{${spaces}}P_{${adjW}} \\) = ${count} 通り`;
            explanationBodyCirc.innerHTML = `
                <p><strong>どの女子も隣り合わない</strong>条件では、<strong>「まず制限のない要素（男子 ${adjM} 人）を先に並べ、その間と両端の隙間に女子を入れる」</strong>という手順を踏みます。</p>
                <p>① 男子 <code>${adjM}</code> 人を一列に並べます: <code>M! = ${mFact}</code> 通り</p>
                <p>② 男子の間と両端には、合計 <code>M + 1 = ${spaces}</code> 箇所の隙間（▲）ができます。この <code>${spaces}</code> 箇所から <code>${adjW}</code> 箇所を選んで女子を1人ずつ配置します: <code>${spaces}P${adjW} = ${pVal}</code> 通り</p>
                <p>これらを掛け合わせて、<code>M! × {}_{M+1}P_{W}</code> となります。</p>
            `;
        }

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([mathFormulaCirc, mathStepsCirc, explanationBodyCirc]).catch(err => console.log(err));
        }
    }

    // --- Phase 2 可視化描画 ---
    function renderVisualizationCirc(pattern) {
        elementsContainerCirc.innerHTML = '';
        if (!pattern) return;

        const isCircular = !currentPatternCirc.startsWith('p13');

        if (isCircular) {
            // 円順列・数珠順列：円形配置
            elementsContainerCirc.style.flexDirection = 'row';
            
            // 円形レイアウト用のサブコンテナ
            const circWrapper = document.createElement('div');
            circWrapper.className = 'circ-visual-area';
            circWrapper.id = 'circ-wrapper';
            
            const radius = 95; // 配置半径
            const nItems = pattern.length;

            pattern.forEach((elem, index) => {
                const el = document.createElement('div');
                el.className = `visual-element type-${elementType} color-${elem.colorIdx}`;
                el.textContent = elem.label;
                
                // 三角関数で円周上の座標を計算
                const angle = (index * 2 * Math.PI / nItems) - Math.PI / 2; // 上から時計回り
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                
                el.style.setProperty('--x', `${x}px`);
                el.style.setProperty('--y', `${y}px`);
                circWrapper.appendChild(el);
            });

            // 円の中心に小さなガイド（オプション）
            const centerPoint = document.createElement('div');
            centerPoint.style.position = 'absolute';
            centerPoint.style.width = '6px';
            centerPoint.style.height = '6px';
            centerPoint.style.borderRadius = '50%';
            centerPoint.style.background = 'rgba(255,255,255,0.15)';
            circWrapper.appendChild(centerPoint);

            elementsContainerCirc.appendChild(circWrapper);
        } else {
            // 隣接制限：直線配置
            elementsContainerCirc.style.flexDirection = 'row';
            elementsContainerCirc.style.gap = '1.2rem';

            if (currentPatternCirc === 'p13-1') {
                // 隣り合う：女子グループをひとまとめの枠で囲む
                // パターン配列内を走査し、Wが連続する区間を特定
                let inWGroup = false;
                let groupDiv = null;

                pattern.forEach(elem => {
                    if (elem.type === 'W') {
                        if (!inWGroup) {
                            inWGroup = true;
                            groupDiv = document.createElement('div');
                            groupDiv.className = 'adj-group-box';
                            elementsContainerCirc.appendChild(groupDiv);
                        }
                        const el = document.createElement('div');
                        el.className = `visual-element type-${elementType} gender-${elem.type}`;
                        el.textContent = elem.label;
                        groupDiv.appendChild(el);
                    } else {
                        inWGroup = false;
                        const el = document.createElement('div');
                        el.className = `visual-element type-${elementType} gender-${elem.type}`;
                        el.textContent = elem.label;
                        elementsContainerCirc.appendChild(el);
                    }
                });
            } else if (currentPatternCirc === 'p13-2') {
                // 隣り合わない：男子の隙間に女子を入れる
                // ビジュアル表現として、男子(M)と隙間(▲)をベースに表示し、女子がその隙間に配置されている様子を見せる
                // すなわち、男子の合間に ▲ または女子そのものを描画する
                
                // 表示を見やすくするため、まず男子が並んでおり、その「隙間」を明示する
                // pattern の順に描画するが、Wの前に隙間インジケータを入れるのではなく、
                // 「Mの間に隙間マークがあり、そこにWが入っている」という静的/動的表示にする。
                
                pattern.forEach((elem, idx) => {
                    const el = document.createElement('div');
                    el.className = `visual-element type-${elementType} gender-${elem.type}`;
                    el.textContent = elem.label;
                    
                    // 女子の場合は少し浮き立たせる
                    if (elem.type === 'W') {
                        el.style.boxShadow = '0 0 15px rgba(219,39,119,0.5)';
                    }
                    elementsContainerCirc.appendChild(el);

                    // 男子の後ろには隙間表示用の矢印/ドットを挟む（最後以外）
                    // ただし、隣り合わない表示なので、次の要素が何かに関わらず、
                    // 男子と男子の間、あるいは両端の隙間のイメージを示す
                });
            }
        }
    }

    // --- Phase 2 アニメーション再生（プールから円/直線へ並ぶ） ---
    function playTransitionCirc() {
        const pattern = activePatternsCirc[currentDisplayIndexCirc];
        if (!pattern) return;

        btnAnimateCirc.disabled = true;
        btnAnimateCirc.textContent = '計算中...';

        const isCircular = !currentPatternCirc.startsWith('p13');
        
        // 1. 直線/円を一旦クリア
        elementsContainerCirc.innerHTML = '';

        if (isCircular) {
            // 円形の場合、中央に要素をギュッと集めた状態から円周へ広がるアニメーション
            const circWrapper = document.createElement('div');
            circWrapper.className = 'circ-visual-area';
            circWrapper.id = 'circ-wrapper';
            elementsContainerCirc.appendChild(circWrapper);

            // 一旦中心に重ねて生成
            const radius = 95;
            const nItems = pattern.length;

            pattern.forEach((elem, index) => {
                const el = document.createElement('div');
                el.className = `visual-element type-${elementType} color-${elem.colorIdx}`;
                el.textContent = elem.label;
                el.style.setProperty('--x', `0px`);
                el.style.setProperty('--y', `0px`);
                el.style.opacity = '0';
                circWrapper.appendChild(el);
            });

            // 順次、円周上へ広がっていく
            setTimeout(() => {
                const childElements = Array.from(circWrapper.children);
                childElements.forEach((el, index) => {
                    if (el.style.position === 'absolute') {
                        const angle = (index * 2 * Math.PI / nItems) - Math.PI / 2;
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.setProperty('--x', `${x}px`);
                            el.style.setProperty('--y', `${y}px`);
                        }, index * 150); // 150msずつずらして広げる
                    }
                });

                // アニメーション終了処理
                setTimeout(() => {
                    btnAnimateCirc.disabled = false;
                    btnAnimateCirc.textContent = '並び替えを再生';
                }, nItems * 150 + 500);

            }, 200);

        } else {
            // 隣接制限の場合、左から順にふわっと要素が現れる
            let step = 0;
            btnAnimateCirc.textContent = '整列中...';
            
            // 隣り合う・隣り合わないの構造通りに生成するが、
            // 空の状態から1つずつ要素を append していく
            if (currentPatternCirc === 'p13-1') {
                // 隣り合う
                let inWGroup = false;
                let groupDiv = null;

                function appendNextAdj() {
                    if (step >= pattern.length) {
                        btnAnimateCirc.disabled = false;
                        btnAnimateCirc.textContent = '並び替えを再生';
                        return;
                    }

                    const elem = pattern[step];
                    if (elem.type === 'W') {
                        if (!inWGroup) {
                            inWGroup = true;
                            groupDiv = document.createElement('div');
                            groupDiv.className = 'adj-group-box';
                            groupDiv.style.opacity = '0';
                            groupDiv.style.transition = 'opacity 0.3s ease';
                            elementsContainerCirc.appendChild(groupDiv);
                            requestAnimationFrame(() => groupDiv.style.opacity = '1');
                        }
                        const el = document.createElement('div');
                        el.className = `visual-element type-${elementType} gender-${elem.type}`;
                        el.textContent = elem.label;
                        el.style.opacity = '0';
                        el.style.transition = 'opacity 0.2s ease';
                        groupDiv.appendChild(el);
                        requestAnimationFrame(() => el.style.opacity = '1');
                    } else {
                        inWGroup = false;
                        const el = document.createElement('div');
                        el.className = `visual-element type-${elementType} gender-${elem.type}`;
                        el.textContent = elem.label;
                        el.style.opacity = '0';
                        el.style.transition = 'opacity 0.3s ease';
                        elementsContainerCirc.appendChild(el);
                        requestAnimationFrame(() => el.style.opacity = '1');
                    }

                    step++;
                    setTimeout(appendNextAdj, 250);
                }
                appendNextAdj();

            } else {
                // 隣り合わない
                // 男子(M)を先に並べ、その間に隙間(▲)を示し、最後に女子(W)が隙間に滑り込む2段階アニメーション！
                // 1. 男子と隙間を並べる
                const mElements = pattern.filter(e => e.type === 'M');
                const wElements = pattern.filter(e => e.type === 'W');
                
                // 男子だけを一列に並べる
                mElements.forEach((m, idx) => {
                    const el = document.createElement('div');
                    el.className = `visual-element type-${elementType} gender-M`;
                    el.textContent = m.label;
                    el.style.opacity = '0';
                    el.style.transition = 'opacity 0.3s ease';
                    elementsContainerCirc.appendChild(el);
                    
                    // 男子の間に隙間マークを置く
                    if (idx < mElements.length) {
                        const gap = document.createElement('div');
                        gap.className = 'gap-indicator';
                        gap.textContent = '▲';
                        gap.style.opacity = '0';
                        gap.style.transition = 'opacity 0.3s ease';
                        elementsContainerCirc.appendChild(gap);
                    }
                });

                // 男子と隙間を順にフェードイン
                const children = Array.from(elementsContainerCirc.children);
                children.forEach((child, idx) => {
                    setTimeout(() => {
                        child.style.opacity = '1';
                    }, idx * 150);
                });

                // 2. 隙間の位置に女子を挿入していく
                // (少し待ってから実行)
                setTimeout(() => {
                    // 男子と隙間の状態から、実際の pattern（女子が隙間にいる状態）へ移行する
                    elementsContainerCirc.innerHTML = '';
                    
                    // 最終パターンを左から1つずつ描画
                    pattern.forEach((elem, idx) => {
                        const el = document.createElement('div');
                        el.className = `visual-element type-${elementType} gender-${elem.type}`;
                        el.textContent = elem.label;
                        el.style.opacity = '0';
                        el.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                        if (elem.type === 'W') {
                            el.style.transform = 'translateY(-20px)'; // 上から落ちてくるように
                            el.style.boxShadow = '0 0 15px rgba(219,39,119,0.5)';
                        }
                        elementsContainerCirc.appendChild(el);
                    });

                    // フェードイン＆スライド
                    const finalChildren = Array.from(elementsContainerCirc.children);
                    finalChildren.forEach((child, idx) => {
                        setTimeout(() => {
                            child.style.opacity = '1';
                            child.style.transform = 'translateY(0)';
                        }, idx * 100);
                    });

                    setTimeout(() => {
                        btnAnimateCirc.disabled = false;
                        btnAnimateCirc.textContent = '並び替えを再生';
                    }, finalChildren.length * 100 + 400);

                }, children.length * 150 + 600);
            }
        }
    }

    // --- Phase 2 回転シミュレーション ---
    function toggleCircRotation() {
        const wrapper = document.getElementById('circ-wrapper');
        if (!wrapper) return;

        if (isCircRotating) {
            wrapper.classList.remove('rotating');
            btnRotateCirc.textContent = '回転を確認';
        } else {
            wrapper.classList.remove('flipping'); // 反転は止める
            isCircFlipped = false;
            btnFlipCirc.textContent = '裏返しを確認';
            
            wrapper.classList.add('rotating');
            btnRotateCirc.textContent = '回転を停止';
            alert('回転して位置が重なるものは、円順列では「すべて同じ1通りの並び方」としてカウントされます。(=^・^=)');
        }
        isCircRotating = !isCircRotating;
    }

    // --- Phase 2 裏返しシミュレーション ---
    function toggleCircFlip() {
        const wrapper = document.getElementById('circ-wrapper');
        if (!wrapper) return;

        wrapper.classList.remove('rotating'); // 回転は止める
        isCircRotating = false;
        btnRotateCirc.textContent = '回転を確認';

        // 3D裏返しアニメーションを実行
        wrapper.classList.remove('flipping');
        void wrapper.offsetWidth; // リフローをトリガーして再読み込み
        wrapper.classList.add('flipping');
        
        alert('裏返して重なるもの（鏡に映した対称なもの）は、数珠順列では「同じ並び方（1通り）」とみなします。(=^・^=)✨');
    }


    // ==========================================================================
    // --- 6. イベントリスナーの設定 ---
    // ==========================================================================
    
    // タブ切り替えイベント
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (tab.classList.contains('locked')) {
                e.preventDefault();
                alert('このテーマは後続フェーズでアンロックされます。まずは基本の順列・組合せの学習から進めましょう！(=^・^=)');
                return;
            }
            
            // アクティブタブの切り替え
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // コンテンツの切り替え
            const targetTab = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab).classList.add('active');

            // 各タブに応じた初期化/再描画
            if (targetTab === 'tab-pc') {
                syncParameters();
            } else if (targetTab === 'tab-circular') {
                syncParametersCirc();
            }
        });
    });

    // Phase 1 コントロール
    patternSelect.addEventListener('change', syncParameters);
    paramN.addEventListener('input', syncParameters);
    paramR.addEventListener('input', syncParameters);
    
    Object.keys(dupCountInputs).forEach(key => {
        dupCountInputs[key].addEventListener('change', syncParameters);
    });

    document.querySelectorAll('input[name="element-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            syncParameters();
            if (document.getElementById('tab-circular').classList.contains('active')) {
                syncParametersCirc();
            }
        });
    });


    // ==========================================================================
    // --- Phase 3: 重複組合せ・写像12相相関の実装 ---
    // ==========================================================================

    // 1. Phase 3 用のDOM要素取得
    const patternSelectMulti = document.getElementById('pattern-select-multi');
    const paramMultiN = document.getElementById('param-multi-n');
    const valMultiN = document.getElementById('val-multi-n');
    const paramMultiK = document.getElementById('param-multi-k');
    const valMultiK = document.getElementById('val-multi-k');
    const multiParams = document.getElementById('multi-params');
    const matrixControls = document.getElementById('matrix-controls');
    const paramMatN = document.getElementById('param-mat-n');
    const valMatN = document.getElementById('val-mat-n');
    const paramMatK = document.getElementById('param-mat-k');
    const valMatK = document.getElementById('val-mat-k');
    const matrixEmptyRadios = document.querySelectorAll('input[name="matrix-empty"]');
    const btnAnimateMulti = document.getElementById('btn-animate-multi');
    const elementsContainerMulti = document.getElementById('elements-container-multi');
    const mathFormulaMulti = document.getElementById('math-formula-multi');
    const mathStepsMulti = document.getElementById('math-steps-multi');
    const explanationBodyMulti = document.getElementById('explanation-body-multi');
    const patternsListMulti = document.getElementById('patterns-list-multi');
    const resultsCountMulti = document.getElementById('results-count-multi');
    const visualizerSubtitleMulti = document.getElementById('visualizer-subtitle-multi');

    // Phase 3 の状態
    let currentPatternMulti = 'p14';
    let multiN = 6;
    let multiK = 3;
    let matN = 4;
    let matK = 3;
    let matAllowEmpty = true;
    let activePatternsMulti = [];
    let currentDisplayIndexMulti = 0;
    let activeMatrixCell = 'cell-ur-ur'; // 現在選択されているマトリックスセル

    // 数学関数: スターリング数 S(n, k)
    function getStirling2(n, k) {
        if (k === 1 || n === k) return 1;
        if (k > n || k < 1) return 0;
        return k * getStirling2(n - 1, k) + getStirling2(n - 1, k - 1);
    }

    // 数学関数: 分割数 P(n, k) - nをk個の正整数の和に分ける
    function getPartition(n, k) {
        if (n < 0 || k < 1) return 0;
        if (n === 0 || k === 1 || n === k) return 1;
        if (n < k) return 0;
        return getPartition(n - 1, k - 1) + getPartition(n - k, k);
    }

    // 数学関数: 分割数の和 - nをk個以下の非負整数の和に分ける
    function getPartitionSum(n, k) {
        let sum = 0;
        for (let j = 1; j <= k; j++) {
            sum += getPartition(n, j);
        }
        return sum;
    }

    // 重複組合せの分配パターンの全列挙 (和がnになる非負整数の組)
    function generateMultisetPartitions(n, k, minLimits) {
        const results = [];
        
        function backtrack(temp, sum, index) {
            if (index === k) {
                if (sum === n) {
                    results.push([...temp]);
                }
                return;
            }
            
            const minVal = minLimits[index] || 0;
            // 残りの枠で最低限必要な個数
            let remainingMin = 0;
            for (let i = index + 1; i < k; i++) {
                remainingMin += minLimits[i] || 0;
            }

            const maxVal = n - sum - remainingMin;

            for (let val = minVal; val <= maxVal; val++) {
                backtrack([...temp, val], sum + val, index + 1);
            }
        }

        backtrack([], 0, 0);
        return results;
    }

    // 写像12相の全パターン列挙用 (可視化＆リスト用)
    // n個のボール(球)をk個の箱(箱)に入れる
    function generateMatrixPatterns(n, k, ballDist, boxDist, allowEmpty) {
        const results = [];
        
        // 1. ボール区別あり, 箱区別あり
        if (ballDist === 'dist' && boxDist === 'dist') {
            // 全ての配分パターン K^N を全列挙
            // 例: N=3, K=2 -> [0,0,0], [0,0,1], [0,1,0]... (各ボールがどの箱に入るか)
            function backtrack(temp, index) {
                if (index === n) {
                    // 空箱禁止チェック
                    if (!allowEmpty) {
                        const usedBoxes = new Set(temp);
                        if (usedBoxes.size < k) return;
                    }
                    results.push([...temp]);
                    return;
                }
                for (let i = 0; i < k; i++) {
                    backtrack([...temp, i], index + 1);
                }
            }
            backtrack([], 0);
            return results;
        }

        // 2. ボール区別なし, 箱区別あり (重複組合せ)
        if (ballDist === 'indist' && boxDist === 'dist') {
            // 各箱に入るボールの個数 [x1, x2... xk] で、合計が n
            const minLimits = Array(k).fill(allowEmpty ? 0 : 1);
            return generateMultisetPartitions(n, k, minLimits);
        }

        // 3. ボール区別あり, 箱区別なし (組分け)
        if (ballDist === 'dist' && boxDist === 'indist') {
            // 区別のあるボールを区別のないグループに分ける
            // 代表シグネチャによる重複排除
            // まず「ボール区別あり、箱区別あり」で列挙し、
            // 箱のラベル(0,1,2)の並び替えを同一視した上で代表値をシグネチャとする
            const rawPatterns = generateMatrixPatterns(n, k, 'dist', 'dist', allowEmpty);
            const seen = new Set();
            const filtered = [];

            rawPatterns.forEach(pattern => {
                // ボールのグループ分け構造を文字列化する
                // 例: ボール0,1が箱A、ボール2が箱B -> グループ=[[0,1], [2]]
                // これを各グループ内はソート、グループ同士もソートして文字列化
                const groups = Array.from({ length: k }, () => []);
                pattern.forEach((boxIdx, ballIdx) => {
                    groups[boxIdx].push(ballIdx);
                });
                
                // 空のグループを除去し、各グループ内をソート
                const sortedGroups = groups
                    .map(g => g.sort((a,b) => a-b))
                    .filter(g => g.length > 0);
                
                // グループ同士を「最初の要素の値」などでソート
                sortedGroups.sort((a,b) => a[0] - b[0]);
                
                const sig = sortedGroups.map(g => g.join(',')).join('|');
                if (!seen.has(sig)) {
                    seen.add(sig);
                    // 描画しやすいよう、箱の割り当て配列形式に復元する
                    // 箱の区別はないため、辞書順にグループインデックスを割り振る
                    const restored = Array(n).fill(0);
                    sortedGroups.forEach((g, gIdx) => {
                        g.forEach(ballIdx => {
                            restored[ballIdx] = gIdx;
                        });
                    });
                    filtered.push(restored);
                }
            });
            return filtered;
        }

        // 4. ボール区別なし, 箱区別なし (整数の分割)
        if (ballDist === 'indist' && boxDist === 'indist') {
            // 個数分布 [x1, x2... xk] (合計n) のうち、ソートして同じになるものを同一視する
            const minLimits = Array(k).fill(allowEmpty ? 0 : 1);
            const rawPartitions = generateMultisetPartitions(n, k, minLimits);
            const seen = new Set();
            const filtered = [];

            rawPartitions.forEach(part => {
                const sorted = [...part].sort((a, b) => b - a); // 降順ソート (例: [3,1,0])
                const sig = sorted.join(',');
                if (!seen.has(sig)) {
                    seen.add(sig);
                    filtered.push(sorted);
                }
            });
            return filtered;
        }

        return [];
    }

    // --- Phase 3 パラメータ同期 ---
    function syncParametersMultiset() {
        currentPatternMulti = patternSelectMulti.value;
        
        if (currentPatternMulti === 'p-matrix') {
            multiParams.classList.add('hidden');
            matrixControls.classList.remove('hidden');
            
            matN = parseInt(paramMatN.value);
            matK = parseInt(paramMatK.value);
            matAllowEmpty = document.querySelector('input[name="matrix-empty"]:checked').value === 'allow';
            
            valMatN.textContent = matN;
            valMatK.textContent = matK;

            visualizerSubtitleMulti.textContent = '📊 類似性と相関マトリックス (写像12相)';
            btnAnimateMulti.classList.add('hidden');
        } else {
            multiParams.classList.remove('hidden');
            matrixControls.classList.add('hidden');
            
            multiN = parseInt(paramMultiN.value);
            multiK = parseInt(paramMultiK.value);
            valMultiN.textContent = multiN;
            valMultiK.textContent = multiK;

            visualizerSubtitleMulti.textContent = '🍎 リアルタイム可視化 (仕切りモデル)';
            btnAnimateMulti.classList.remove('hidden');
        }

        calculateAndDisplayMultiset();
    }

    // --- Phase 3 計算・表示 ---
    function calculateAndDisplayMultiset() {
        patternsListMulti.innerHTML = '';
        elementsContainerMulti.innerHTML = '';
        currentDisplayIndexMulti = 0;

        if (currentPatternMulti === 'p14') {
            // 重複組合せ (制限なし)
            activePatternsMulti = generateMultisetPartitions(multiN, multiK, Array(multiK).fill(0));
            resultsCountMulti.textContent = activePatternsMulti.length;
            renderFormulaAndExplanationMultiset();
            renderListMultiset();
            renderVisualizationMultiset(activePatternsMulti[0]);
        } else if (currentPatternMulti === 'p15') {
            // 重複組合せ (A>=2, B>=3, C>=1, D>=0)
            const minLimits = [2, 3, 1, 0];
            activePatternsMulti = generateMultisetPartitions(multiN, multiK, minLimits);
            resultsCountMulti.textContent = activePatternsMulti.length;
            renderFormulaAndExplanationMultiset();
            renderListMultiset();
            renderVisualizationMultiset(activePatternsMulti[0]);
        } else if (currentPatternMulti === 'p-matrix') {
            // 写像12相マトリックス表示
            renderMatrixUI();
        }
    }

    // 重複組合せ用リストレンダリング
    function renderListMultiset() {
        if (activePatternsMulti.length === 0) {
            patternsListMulti.innerHTML = '<p class="help-text">条件を満たす配分はありません（リンゴが足りません）。</p>';
            return;
        }

        activePatternsMulti.forEach((pattern, index) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            if (index === 0) item.classList.add('active-pattern');

            const seqDiv = document.createElement('div');
            seqDiv.className = 'pattern-sequence';
            seqDiv.style.fontSize = '0.9rem';
            seqDiv.style.fontWeight = '700';

            // 配分形式で描画 (例: [3, 1, 2] -> A:3, B:1, C:2)
            const parts = [];
            pattern.forEach((val, idx) => {
                parts.push(`${ELEMENT_DEFS[idx].label}:${val}`);
            });
            seqDiv.textContent = `[ ${parts.join(', ')} ]`;

            const idxSpan = document.createElement('span');
            idxSpan.className = 'pattern-index';
            idxSpan.textContent = `#${index + 1}`;

            item.appendChild(seqDiv);
            item.appendChild(idxSpan);

            item.addEventListener('click', () => {
                document.querySelectorAll('#patterns-list-multi .pattern-item').forEach(el => el.classList.remove('active-pattern'));
                item.classList.add('active-pattern');
                currentDisplayIndexMulti = index;
                renderVisualizationMultiset(pattern);
            });

            patternsListMulti.appendChild(item);
        });
    }

    // --- Phase 3 数式・解説 (重複組合せ) ---
    function renderFormulaAndExplanationMultiset() {
        if (currentPatternMulti === 'p14') {
            const count = getnCr(multiN + multiK - 1, multiK - 1);
            mathFormulaMulti.innerHTML = `\\( _{${multiN}}H_{${multiK}} = {}_{${multiN}+${multiK}-1}C_{${multiK}-1} = {}_{${multiN + multiK - 1}}C_{${multiK - 1}} = ${count} \\)`;
            mathStepsCirc.innerHTML = '';
            mathStepsMulti.innerHTML = `りんご ${multiN} 個と仕切り ${multiK - 1} 枚の並び替え: \\( \\frac{(${multiN}+${multiK}-1)!}{${multiN}! \\times (${multiK}-1)!} = ${count} \\) 通り`;
            explanationBodyMulti.innerHTML = `
                <p><strong>重複組合せ ($nHk$)</strong>は、区別のない $n$ 個のモノを区別のある $k$ 個のグループ（子供）に分ける方法の数です（もらえない子供がいても良い）。</p>
                <p>これは、<strong>「$n$ 個のモノ（〇）と $k-1$ 個の仕切り（｜）を一列に並べる」</strong>というモデルに1対1対応します。</p>
                <p>現在の設定: りんご <code>${multiN}</code> 個、子供 <code>${multiK}</code> 人（仕切り <code>${multiK - 1}</code> 枚）の並び替え問題になり、計算式は <code>{}_{n+k-1}C_{k-1}</code> となります。</p>
            `;
        } else if (currentPatternMulti === 'p15') {
            // 制限あり
            const limits = [2, 3, 1, 0];
            const sumLimits = limits.slice(0, multiK).reduce((a, b) => a + b, 0);
            const remainingN = multiN - sumLimits;
            
            if (remainingN < 0) {
                mathFormulaMulti.innerHTML = `\\( \\text{計算不可能 (負数)} \\)`;
                mathStepsMulti.innerHTML = `必要な最低個数の合計 (${sumLimits}) が、用意されたリンゴの数 (${multiN}) を超えています。`;
                explanationBodyMulti.innerHTML = `<p class="help-text" style="color:var(--danger)">リンゴの数を増やしてください。</p>`;
                return;
            }

            const count = getnCr(remainingN + multiK - 1, multiK - 1);
            
            mathFormulaMulti.innerHTML = `\\( {}_{${remainingN}}H_{${multiK}} = {}_{${remainingN}+${multiK}-1}C_{${multiK}-1} = {}_{${remainingN + multiK - 1}}C_{${multiK - 1}} = ${count} \\)`;
            
            const limitStrings = [];
            limits.slice(0, multiK).forEach((v, i) => {
                limitStrings.push(`${ELEMENT_DEFS[i].label}君に${v}個`);
            });

            mathStepsMulti.innerHTML = `最低個数を配った残りのリンゴ ${remainingN} 個を ${multiK} 人に分ける: ${count} 通り`;
            explanationBodyMulti.innerHTML = `
                <p>最低個数の制限がある場合、<strong>「あらかじめ必要な最小個数をそれぞれに配っておく（取り分けておく）」</strong>ことで、制限なしの重複組合せ問題に還元できます。</p>
                <p>あらかじめ配る個数: <code>${limitStrings.join(', ')}</code> (合計 <code>${sumLimits}</code> 個)</p>
                <p>残りのリンゴ: <code>${multiN} - ${sumLimits} = ${remainingN}</code> 個。この <code>${remainingN}</code> 個の残りを <code>${multiK}</code> 人に配る重複組合せ <code>{}_{${remainingN}}H_{${multiK}}</code> を計算します。</p>
            `;
        }

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([mathFormulaMulti, mathStepsMulti, explanationBodyMulti]).catch(err => console.log(err));
        }
    }

    // --- Phase 3 可視化 (重複組合せ) ---
    function renderVisualizationMultiset(pattern) {
        elementsContainerMulti.innerHTML = '';
        if (!pattern) return;

        // 1. 上段: りんごと仕切りの一列並び
        const row1 = document.createElement('div');
        row1.style.display = 'flex';
        row1.style.gap = '0.5rem';
        row1.style.justifyContent = 'center';
        row1.style.alignItems = 'center';
        row1.style.minHeight = '70px';
        row1.style.width = '100%';

        // パターン [3, 1, 2] を 〇〇〇｜〇｜〇〇 に変換して並べる
        const seqElements = [];
        pattern.forEach((count, idx) => {
            for (let i = 0; i < count; i++) {
                seqElements.push({ type: 'apple', label: '🍎', colorIdx: 0 });
            }
            if (idx < pattern.length - 1) {
                seqElements.push({ type: 'bar', label: '｜', colorIdx: 5 });
            }
        });

        seqElements.forEach(elem => {
            const el = document.createElement('div');
            el.className = `visual-element type-${elem.type}`;
            if (elem.type === 'apple') {
                el.style.width = '48px';
                el.style.height = '48px';
            }
            row1.appendChild(el);
        });

        elementsContainerMulti.appendChild(row1);

        // 2. 下段: 子供の箱
        const row2 = document.createElement('div');
        row2.className = 'child-box-container';

        pattern.forEach((count, idx) => {
            const box = document.createElement('div');
            box.className = 'child-box';
            box.setAttribute('data-child-name', `${ELEMENT_DEFS[idx].label}君`);
            box.id = `child-box-${idx}`;

            // 中にりんごを描画
            for (let i = 0; i < count; i++) {
                const apple = document.createElement('div');
                apple.className = 'visual-element type-apple';
                apple.style.width = '40px';
                apple.style.height = '40px';
                apple.style.fontSize = '0.8rem';
                box.appendChild(apple);
            }

            row2.appendChild(box);
        });

        elementsContainerMulti.appendChild(row2);
    }

    // --- Phase 3 アニメーション (仕切りが動き、りんごが箱へ落ちる) ---
    function playTransitionMultiset() {
        if (currentPatternMulti === 'p-matrix') return;
        
        const pattern = activePatternsMulti[currentDisplayIndexMulti];
        if (!pattern) return;

        btnAnimateMulti.disabled = true;
        btnAnimateMulti.textContent = '計算中...';

        // 可視化エリアをクリアして、まずは上段に「りんごと仕切り」だけを表示
        elementsContainerMulti.innerHTML = '';
        
        const row1 = document.createElement('div');
        row1.style.display = 'flex';
        row1.style.gap = '0.6rem';
        row1.style.justifyContent = 'center';
        row1.style.alignItems = 'center';
        row1.style.minHeight = '70px';
        row1.style.width = '100%';
        elementsContainerMulti.appendChild(row1);

        const seqElements = [];
        pattern.forEach((count, idx) => {
            for (let i = 0; i < count; i++) {
                seqElements.push({ type: 'apple', childIdx: idx });
            }
            if (idx < pattern.length - 1) {
                seqElements.push({ type: 'bar' });
            }
        });

        seqElements.forEach((elem, index) => {
            const el = document.createElement('div');
            el.className = `visual-element type-${elem.type}`;
            if (elem.type === 'apple') {
                el.style.width = '48px';
                el.style.height = '48px';
                el.id = `anim-apple-${index}`;
                el.setAttribute('data-child-idx', elem.childIdx);
            } else {
                el.id = `anim-bar-${index}`;
            }
            el.style.opacity = '0';
            el.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            row1.appendChild(el);
        });

        // 順次フェードインで並べる
        const children = Array.from(row1.children);
        children.forEach((child, idx) => {
            setTimeout(() => {
                child.style.opacity = '1';
            }, idx * 100);
        });

        // 2. 子供の空箱を配置
        setTimeout(() => {
            const row2 = document.createElement('div');
            row2.className = 'child-box-container';
            elementsContainerMulti.appendChild(row2);

            pattern.forEach((count, idx) => {
                const box = document.createElement('div');
                box.className = 'child-box';
                box.setAttribute('data-child-name', `${ELEMENT_DEFS[idx].label}君`);
                box.id = `child-box-anim-${idx}`;
                box.style.opacity = '0';
                box.style.transition = 'opacity 0.4s ease';
                row2.appendChild(box);
                requestAnimationFrame(() => box.style.opacity = '1');
            });

            // 3. りんごが仕切りで分けられて、それぞれの箱へ「落ちていく」アニメーション
            setTimeout(() => {
                // 仕切り(｜)をフェードアウト
                children.forEach(child => {
                    if (child.classList.contains('type-bar')) {
                        child.style.opacity = '0.1';
                        child.style.transform = 'scaleY(0.2)';
                    }
                });

                // 各りんごを移動
                const apples = children.filter(c => c.classList.contains('type-apple'));
                
                apples.forEach((apple, aIdx) => {
                    const childIdx = apple.getAttribute('data-child-idx');
                    const targetBox = document.getElementById(`child-box-anim-${childIdx}`);
                    
                    if (targetBox) {
                        const appRect = apple.getBoundingClientRect();
                        const boxRect = targetBox.getBoundingClientRect();

                        // 箱の中心あたりへ移動
                        const dX = (boxRect.left + boxRect.width/2) - (appRect.left + appRect.width/2);
                        const dY = (boxRect.top + boxRect.height/3) - (appRect.top + apple.offsetHeight/2);

                        // 落下アニメーション
                        apple.style.transform = `translate(${dX}px, ${dY}px) scale(0.8)`;
                        
                        setTimeout(() => {
                            apple.style.opacity = '0'; // 上段の要素は消す
                            
                            // 箱の中にりんごを新規配置
                            const newApple = document.createElement('div');
                            newApple.className = 'visual-element type-apple';
                            newApple.style.width = '40px';
                            newApple.style.height = '40px';
                            newApple.style.fontSize = '0.8rem';
                            newApple.style.opacity = '0';
                            newApple.style.transition = 'opacity 0.2s ease';
                            
                            targetBox.appendChild(newApple);
                            requestAnimationFrame(() => newApple.style.opacity = '1');
                        }, 500);
                    }
                });

                setTimeout(() => {
                    btnAnimateMulti.disabled = false;
                    btnAnimateMulti.textContent = 'シミュレーションを再生';
                }, 800);

            }, 800);

        }, children.length * 100 + 400);
    }

    // --- Phase 3 相関マトリックス UI の描画 ---
    function renderMatrixUI() {
        elementsContainerMulti.innerHTML = '';
        btnAnimateMulti.classList.add('hidden'); // マトリックス表示中は非表示

        // マトリックス全体のコンテナ
        const container = document.createElement('div');
        container.className = 'matrix-container';

        // 3x3のグリッドを作成 (ヘッダ含む)
        // 列ヘッダ: ボール区別あり, ボール区別なし
        // 行ヘッダ: 箱区別あり, 箱区別なし
        const grid = document.createElement('div');
        grid.className = 'matrix-grid';

        // 1行目: ヘッダー
        const corner = document.createElement('div');
        corner.className = 'matrix-header';
        corner.innerHTML = 'ボール \\( n \\) 個<br>⬇️<br>箱 \\( k \\) 個';
        grid.appendChild(corner);

        const col1 = document.createElement('div');
        col1.className = 'matrix-header col-title';
        col1.innerHTML = '【区別あり】<br>ボール: A, B, C, D...';
        grid.appendChild(col1);

        const col2 = document.createElement('div');
        col2.className = 'matrix-header col-title';
        col2.innerHTML = '【区別なし】<br>ボール: 〇, 〇, 〇...';
        grid.appendChild(col2);

        // 各セルの計算値
        // 1. ボールあり × 箱あり (部屋割り)
        const valBoxYBallY = matAllowEmpty ? Math.pow(matK, matN) : (getStirling2(matN, matK) * factorial(matK));
        const formBoxYBallY = matAllowEmpty ? `${matK}^{${matN}}` : `S(${matN},${matK}) \\times ${matK}!`;

        // 2. ボールなし × 箱あり (重複組合せ)
        const valBoxYBallN = matAllowEmpty ? getnCr(matN + matK - 1, matK - 1) : getnCr(matN - 1, matK - 1);
        const formBoxYBallN = matAllowEmpty ? `${matN}H${matK}` : `S(${matN-1}C${matK-1})`; // LaTeX簡略表記

        // 3. ボールあり × 箱なし (グループ分け)
        let valBoxNBallY = 0;
        let formBoxNBallY = '';
        if (matAllowEmpty) {
            for (let j = 1; j <= matK; j++) valBoxNBallY += getStirling2(matN, j);
            formBoxNBallY = `\\sum_{j=1}^{${matK}} S(${matN},j)`;
} else {
            valBoxNBallY = getStirling2(matN, matK);
            formBoxNBallY = `S(${matN},${matK})`;
        }

        // 4. ボールなし × 箱なし (整数の分割)
        const valBoxNBallN = matAllowEmpty ? getPartitionSum(matN, matK) : getPartition(matN, matK);
        const formBoxNBallN = matAllowEmpty ? `\\sum P(${matN},j)` : `P(${matN},${matK})`;

        // 2行目: 箱区別あり
        const row1Title = document.createElement('div');
        row1Title.className = 'matrix-header row-title';
        row1Title.innerHTML = '【区別あり】<br>部屋: A, B, C';
        grid.appendChild(row1Title);

        // セル1: ボールあり・箱あり
        const cellYY = createMatrixCell('cell-y-y', '部屋割り (順列の分配)', formBoxYBallY, valBoxYBallY);
        grid.appendChild(cellYY);

        // セル2: ボールなし・箱あり
        const cellYN = createMatrixCell('cell-y-n', '重複組合せ (仕切りモデル)', formBoxYBallN, valBoxYBallN);
        grid.appendChild(cellYN);

        // 3行目: 箱区別なし
        const row2Title = document.createElement('div');
        row2Title.className = 'matrix-header row-title';
        row2Title.innerHTML = '【区別なし】<br>組に名前がない';
        grid.appendChild(row2Title);

        // セル3: ボールあり・箱なし
        const cellNY = createMatrixCell('cell-n-y', '組分け (グループ分け)', formBoxNBallY, valBoxNBallY);
        grid.appendChild(cellNY);

        // セル4: ボールなし・箱なし
        const cellNN = createMatrixCell('cell-n-n', '数え上げ (整数の分割)', formBoxNBallN, valBoxNBallN);
        grid.appendChild(cellNN);

        container.appendChild(grid);
        elementsContainerMulti.appendChild(container);

        // 数式を再レンダリング
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([grid]).catch(err => console.log(err));
        }

        // 初期状態でアクティブなセルを読み込む
        // (存在しない場合はデフォルトにする)
        let activeEl = document.getElementById(activeMatrixCell);
        if (!activeEl) {
            activeMatrixCell = 'cell-y-y';
            activeEl = document.getElementById(activeMatrixCell);
        }
        if (activeEl) {
            activeEl.classList.add('active');
            handleMatrixCellSelect(activeMatrixCell);
        }
    }

    // マトリックスの各セルを作成するヘルパー
    function createMatrixCell(id, title, formula, countVal) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.id = id;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'matrix-cell-title';
        titleDiv.textContent = title;

        const formDiv = document.createElement('div');
        formDiv.className = 'matrix-cell-formula';
        formDiv.innerHTML = `\\( ${formula} \\)`;

        const countDiv = document.createElement('div');
        countDiv.className = 'matrix-cell-count';
        countDiv.textContent = `${countVal} 通り`;

        cell.appendChild(titleDiv);
        cell.appendChild(formDiv);
        cell.appendChild(countDiv);

        cell.addEventListener('click', () => {
            document.querySelectorAll('.matrix-cell').forEach(c => c.classList.remove('active'));
            cell.classList.add('active');
            activeMatrixCell = id;
            handleMatrixCellSelect(id);
        });

        return cell;
    }

    // マトリックスセルが選択された際のアクション (詳細リストと解説を描画)
    function handleMatrixCellSelect(id) {
        patternsListMulti.innerHTML = '';
        
        let ballDist = 'dist'; // dist: 区別あり, indist: 区別なし
        let boxDist = 'dist';
        
        if (id === 'cell-y-y') {
            ballDist = 'dist'; boxDist = 'dist';
        } else if (id === 'cell-y-n') {
            ballDist = 'indist'; boxDist = 'dist';
        } else if (id === 'cell-n-y') {
            ballDist = 'dist'; boxDist = 'indist';
        } else if (id === 'cell-n-n') {
            ballDist = 'indist'; boxDist = 'indist';
        }

        // 全パターンの生成
        const patterns = generateMatrixPatterns(matN, matK, ballDist, boxDist, matAllowEmpty);
        
        // 解説の更新
        renderMatrixExplanation(id, patterns.length);

        // リストの描画
        if (patterns.length === 0) {
            patternsListMulti.innerHTML = '<p class="help-text">条件を満たす組み合わせがありません。</p>';
            return;
        }

        resultsCountMulti.textContent = patterns.length;

        patterns.forEach((pattern, index) => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            
            const seqDiv = document.createElement('div');
            seqDiv.className = 'pattern-sequence';
            seqDiv.style.fontSize = '0.85rem';

            // ビジュアルテキスト化
            if (ballDist === 'dist') {
                // ボール区別あり: 各ボールがどの箱(0,1,2)にいるか
                // 例: [0, 0, 1, 2] -> 0番:A室, 1番:A室, 2番:B室, 3番:C室
                // グループ分け形式で表示
                const groups = Array.from({ length: matK }, () => []);
                pattern.forEach((boxIdx, ballIdx) => {
                    const ballLabel = ELEMENT_DEFS[ballIdx].label;
                    groups[boxIdx].push(ballLabel);
                });
                
                const groupStrings = groups.map((g, idx) => {
                    const boxName = boxDist === 'dist' ? `${ELEMENT_DEFS[idx].label}室` : `組`;
                    return `${boxName}:{${g.join(',') || '空'}}`;
                });
                seqDiv.textContent = `[ ${groupStrings.join(' | ')} ]`;
            } else {
                // ボール区別なし: 各箱に入っているボールの数
                // 例: [3, 1, 0]
                if (boxDist === 'dist') {
                    // 箱区別あり
                    const parts = pattern.map((count, idx) => `${ELEMENT_DEFS[idx].label}箱:${count}個`);
                    seqDiv.textContent = `[ ${parts.join(', ')} ]`;
                } else {
                    // 箱区別なし (単なる数の分割)
                    seqDiv.textContent = `[ 分割数: ${pattern.join(' + ')} ]`;
                }
            }

            const idxSpan = document.createElement('span');
            idxSpan.className = 'pattern-index';
            idxSpan.textContent = `#${index + 1}`;

            item.appendChild(seqDiv);
            item.appendChild(idxSpan);
            patternsListMulti.appendChild(item);
        });
    }

    // マトリックスセル選択時の解説更新
    function renderMatrixExplanation(id, count) {
        if (id === 'cell-y-y') {
            // 部屋割り
            mathFormulaMulti.innerHTML = matAllowEmpty ? 
                `\\( k^n = ${matK}^{${matN}} = ${count} \\text{ 通り} \\)` : 
                `\\( S(${matN}, ${matK}) \\times k! = ${getStirling2(matN, matK)} \\times ${factorial(matK)} = ${count} \\text{ 通り} \\)`;
            
            mathStepsMulti.innerHTML = matAllowEmpty ? 
                `ボール ${matN} 個それぞれについて、入る部屋の選び方が ${matK} 通りある` :
                `ボールを ${matK} つのグループに分ける方法 S(${matN},${matK}) × 部屋の区別 k!`;

            explanationBodyMulti.innerHTML = `
                <p><strong>ボール区別あり × 箱区別あり（部屋割り）</strong></p>
                <p>・<strong>空き部屋あり</strong>の場合、各ボールについて <code>k</code> 通りの部屋の選び方があるため、単純な重複順列 <code>k^n</code> になります。</p>
                <p>・<strong>空き部屋なし</strong>の場合、区別されたボールをまず <code>k</code> 個のグループに分割し（第二種スターリング数 $S(n,k)$）、その後 <code>k!</code> 通りの部屋に割り当てます。</p>
            `;
        } else if (id === 'cell-y-n') {
            // 重複組合せ
            const valH = matAllowEmpty ? getnCr(matN + matK - 1, matK - 1) : getnCr(matN - 1, matK - 1);
            mathFormulaMulti.innerHTML = matAllowEmpty ? 
                `\\( {}_{${matN}}H_{${matK}} = {}_{${matN}+${matK}-1}C_{${matK}-1} = ${valH} \\text{ 通り} \\)` :
                `\\( {}_{${matN}-1}C_{${matK}-1} = ${valH} \\text{ 通り} \\)`;
            
            mathStepsMulti.innerHTML = matAllowEmpty ? 
                `区別のないボール ${matN} 個と仕切り ${matK-1} 枚の並び替え` :
                `ボール ${matN} 個の間の隙間 ${matN-1} 箇所から仕切りを入れる ${matK-1} 箇所を選ぶ`;

            explanationBodyMulti.innerHTML = `
                <p><strong>ボール区別なし × 箱区別あり（重複組合せ）</strong></p>
                <p>・これは左の「重複組合せ」タブと同じモデルです。</p>
                <p>・<strong>空き箱なし</strong>（全員1個以上もらう）の場合、あらかじめボールを1つずつ配るか、ボールの「隙間」に仕切りを差し込む（仕切りは重ならない）ため、重複なしの組合せ <code>{}_{n-1}C_{k-1}</code> になります。</p>
            `;
        } else if (id === 'cell-n-y') {
            // 組分け
            let stVal = getStirling2(matN, matK);
            mathFormulaMulti.innerHTML = matAllowEmpty ? 
                `\\( \\sum_{j=1}^{${matK}} S(${matN}, j) = ${count} \\text{ 通り} \\)` :
                `\\( S(${matN}, ${matK}) = ${stVal} \\text{ 通り} \\)`;
            
            mathStepsMulti.innerHTML = matAllowEmpty ? 
                `1〜${matK}個のグループに分ける場合の数の合計` :
                `第2種スターリング数 S(${matN}, ${matK})`;

            explanationBodyMulti.innerHTML = `
                <p><strong>ボール区別あり × 箱区別なし（グループ分け）</strong></p>
                <p>・部屋の区別がなくなるため、部屋割り（部屋に名前がある）で生じた <code>k!</code> 通りの重複（並び替え）を取り除いたものになります。</p>
                <p>・空き箱を許さない場合、ボールをちょうど <code>k</code> 個の空でない組に分ける数そのものであり、<strong>第2種スターリング数 $S(n,k)$</strong> と呼ばれます。</p>
            `;
        } else if (id === 'cell-n-n') {
            // 分割数
            mathFormulaMulti.innerHTML = matAllowEmpty ? 
                `\\( \\sum_{j=1}^{${matK}} P(${matN}, j) = ${count} \\text{ 通り} \\)` :
                `\\( P(${matN}, ${matK}) = ${count} \\text{ 通り} \\)`;
            
            mathStepsMulti.innerHTML = matAllowEmpty ? 
                `整数 ${matN} を ${matK} 個以下の正整数の和に分割する方法の数` :
                `整数 ${matN} をちょうど ${matK} 個の正整数の和に分割する方法の数`;

            explanationBodyMulti.innerHTML = `
                <p><strong>ボール区別なし × 箱区別なし（整数の分割）</strong></p>
                <p>・モノも箱も区別がないため、単に「${matN}個のボールをどのように分けるか」という個数分布（数の足し算パターン）を数える問題になります。</p>
                <p>・例えば、ボール4個を3つに分ける（空き箱なし）場合：<code>[2+1+1]</code> の <code>1通り</code> になります。</p>
                <p>・数学的には、<strong>整数の分割数 $P(n,k)$</strong> として算出されます。</p>
            `;
        }

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([mathFormulaMulti, mathStepsMulti, explanationBodyMulti]).catch(err => console.log(err));
        }
    }


    // ==========================================================================
    // --- 6. イベントリスナーの設定 ---
    // ==========================================================================
    
    // タブ切り替えイベント
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (tab.classList.contains('locked')) {
                e.preventDefault();
                alert('このテーマは後続フェーズでアンロックされます。まずは基本の順列・組合せの学習から進めましょう！(=^・^=)');
                return;
            }
            
            // アクティブタブの切り替え
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // コンテンツの切り替え
            const targetTab = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab).classList.add('active');

            // 各タブに応じた初期化/再描画
            if (targetTab === 'tab-pc') {
                syncParameters();
            } else if (targetTab === 'tab-circular') {
                syncParametersCirc();
            } else if (targetTab === 'tab-multiset') {
                syncParametersMultiset();
            }
        });
    });

    // Phase 1 コントロール
    patternSelect.addEventListener('change', syncParameters);
    paramN.addEventListener('input', syncParameters);
    paramR.addEventListener('input', syncParameters);
    
    Object.keys(dupCountInputs).forEach(key => {
        dupCountInputs[key].addEventListener('change', syncParameters);
    });

    document.querySelectorAll('input[name="element-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            syncParameters();
            if (document.getElementById('tab-circular').classList.contains('active')) {
                syncParametersCirc();
            }
        });
    });

    btnAnimate.addEventListener('click', playTransition);

    // Phase 2 コントロール
    patternSelectCirc.addEventListener('change', syncParametersCirc);
    paramCircN.addEventListener('input', syncParametersCirc);
    paramAdjM.addEventListener('input', syncParametersCirc);
    paramAdjW.addEventListener('input', syncParametersCirc);
    btnAnimateCirc.addEventListener('click', playTransitionCirc);
    btnRotateCirc.addEventListener('click', toggleCircRotation);
    btnFlipCirc.addEventListener('click', toggleCircFlip);

    // Phase 3 コントロール
    patternSelectMulti.addEventListener('change', syncParametersMultiset);
    paramMultiN.addEventListener('input', syncParametersMultiset);
    paramMultiK.addEventListener('input', syncParametersMultiset);
    paramMatN.addEventListener('input', syncParametersMultiset);
    paramMatK.addEventListener('input', syncParametersMultiset);
    
    matrixEmptyRadios.forEach(radio => {
        radio.addEventListener('change', syncParametersMultiset);
    });
    
    btnAnimateMulti.addEventListener('click', playTransitionMultiset);

    // --- 7. 初期化実行 ---
    syncParameters();
});


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

    btnAnimate.addEventListener('click', playTransition);

    // Phase 2 コントロール
    patternSelectCirc.addEventListener('change', syncParametersCirc);
    paramCircN.addEventListener('input', syncParametersCirc);
    paramAdjM.addEventListener('input', syncParametersCirc);
    paramAdjW.addEventListener('input', syncParametersCirc);
    btnAnimateCirc.addEventListener('click', playTransitionCirc);
    btnRotateCirc.addEventListener('click', toggleCircRotation);
    btnFlipCirc.addEventListener('click', toggleCircFlip);

    // --- 7. 初期化実行 ---
    syncParameters();
});


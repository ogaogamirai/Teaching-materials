"""
CP-SAT (Google OR-Tools) 汎用シフトスケジューリング・テンプレート
〜 黄金の3ステップ（変数・ハード制約・ソフト制約）の実装例 〜

実行方法:
    uv run --with ortools python shift_cpsat_template.py
"""

import sys
from ortools.sat.python import cp_model

def solve_schedule():
    # 0. 基本データ
    staff = ["Alice", "Bob", "Charlie", "Dave"]
    days = ["月", "火", "水", "木", "金", "土", "日"]
    shifts = ["D", "N", "O"]  # D:日勤, N:夜勤, O:休日
    
    # モデルの初期化
    model = cp_model.CpModel()
    
    # -------------------------------------------------------------------------
    # ステップ①：決定変数を置く（何を決めるのか？）
    # x[s, d, shift] in {0, 1}
    # -------------------------------------------------------------------------
    x = {}
    for s in staff:
        for d in days:
            for shift in shifts:
                x[s, d, shift] = model.NewBoolVar(f"x_{s}_{d}_{shift}")
                
    # -------------------------------------------------------------------------
    # ステップ②：ハード制約を敷く（絶対に破れない鉄の掟）
    # -------------------------------------------------------------------------
    
    # 制約1: 1日1人1シフトのみ (ExactlyOne)
    # 人間の言葉: 「同じ日に日勤と夜勤を両方やることはできない」
    for s in staff:
        for d in days:
            model.AddExactlyOne([x[s, d, shift] for shift in shifts])
            
    # 制約2: 毎日、日勤1名、夜勤1名が必須 (縦の人数確保)
    # 人間の言葉: 「現場を回すため、毎日の日勤は必ず1名、夜勤も1名」
    for d in days:
        model.Add(sum(x[s, d, "D"] for s in staff) == 1)
        model.Add(sum(x[s, d, "N"] for s in staff) == 1)
        
    # 制約3: 夜勤の翌日は日勤禁止（インターバル規制）
    # 人間の言葉: 「夜勤の翌日は体がもたないので日勤に入れないで」
    # 数式: x[s, 今日, N] + x[s, 明日, D] <= 1
    for s in staff:
        for i in range(len(days) - 1):
            model.Add(x[s, days[i], "N"] + x[s, days[i+1], "D"] <= 1)
            
    # 制約4: どのスタッフにも、一週間に2連休を最低一回取らせる（連休制約）
    # 人間の言葉: 「飛び石連休ばかりは疲れが取れない。最低1回は2日連続の休みを！」
    # 数理ロジック:
    #   1. 各曜日ペア(d, d+1)について、「両日休みか？」を表すブール変数 has_two_off を定義
    #   2. AddBoolAnd([今日休み, 翌日休み]).OnlyEnforceIf(has_two_off) でANDを束縛
    #   3. 週の中の全ペアのうち、少なくとも1つが成立 (sum(two_off_pairs) >= 1)
    for s in staff:
        two_off_pairs = []
        for i in range(len(days) - 1):
            pair_flag = model.NewBoolVar(f"two_off_{s}_{days[i]}_{days[i+1]}")
            model.AddBoolAnd([x[s, days[i], "O"], x[s, days[i+1], "O"]]).OnlyEnforceIf(pair_flag)
            two_off_pairs.append(pair_flag)
        # 6つのペアのうち少なくとも1組が成立
        model.Add(sum(two_off_pairs) >= 1)
        
    # 制約5: 公平性（夜勤回数は1人最大2回まで）
    for s in staff:
        model.Add(sum(x[s, d, "N"] for d in days) <= 2)
        
    # -------------------------------------------------------------------------
    # ステップ③：ソフト制約（目的関数：ペナルティ最小化 / MaxSAT的アプローチ）
    # -------------------------------------------------------------------------
    penalties = []
    
    # 希望休（叶わなければペナルティ加算）
    penalties.append(10 * (1 - x["Alice", "水", "O"]))    # Alice: 水曜休み
    penalties.append(10 * (1 - x["Bob", "土", "O"]))      # Bob: 土曜休み
    penalties.append(10 * (1 - x["Bob", "日", "O"]))      # Bob: 日曜休み
    penalties.append(10 * (1 - x["Charlie", "月", "O"]))  # Charlie: 月曜休み
    penalties.append(10 * (1 - x["Dave", "金", "N"]))     # Dave: 金曜夜勤希望
    
    # 目的関数にセット（不満度の最小化）
    model.Minimize(sum(penalties))
    
    # -------------------------------------------------------------------------
    # ソルバーの実行
    # -------------------------------------------------------------------------
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        print(f"=== 最適解を発見 (Status: {solver.StatusName(status)}) ===")
        print(f"計算時間: {solver.WallTime()*1000:.2f} ms")
        print(f"探索分岐数 (Branches): {solver.NumBranches()}")
        print(f"衝突回数 (Conflicts): {solver.NumConflicts()}\n")
        
        # 表形式で表示
        print(f"{'スタッフ':<8} | " + " | ".join([f"{d:>2}" for d in days]) + " | 夜勤計 | 休日計 | 2連休取得")
        print("-" * 72)
        symbols = {"D": "[日勤]", "N": "[夜勤]", "O": " [休] "}
        for s in staff:
            row = [f"{s:<8}"]
            n_cnt = sum(1 for d in days if solver.Value(x[s, d, "N"]) == 1)
            o_cnt = sum(1 for d in days if solver.Value(x[s, d, "O"]) == 1)
            
            # 2連休が成立した箇所を検出
            renkyu_days = []
            for i in range(len(days) - 1):
                if solver.Value(x[s, days[i], "O"]) == 1 and solver.Value(x[s, days[i+1], "O"]) == 1:
                    renkyu_days.append(f"{days[i]}-{days[i+1]}")
            
            for d in days:
                for shift in shifts:
                    if solver.Value(x[s, d, shift]) == 1:
                        row.append(symbols[shift])
            renkyu_str = ", ".join(renkyu_days) if renkyu_days else "なし"
            print(" | ".join(row) + f" |   {n_cnt}回   |   {o_cnt}日  | {renkyu_str}")
        print("-" * 72)
    else:
        print("解が見つかりませんでした (UNSAT)")

if __name__ == "__main__":
    solve_schedule()

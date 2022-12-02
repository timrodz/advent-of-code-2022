"""
Normal rules
"""
part_1 = {
    # rock
    "A X": 1 + 3,
    "B X": 1 + 0,
    "C X": 1 + 6,
    # paper
    "A Y": 2 + 6,
    "B Y": 2 + 3,
    "C Y": 2 + 0,
    # scissors
    "A Z": 3 + 0,
    "B Z": 3 + 6,
    "C Z": 3 + 3,
}

"""
X means you need to lose, Y means you need to end the round in a draw, and Z means you need to win. Good luck!"
"""
part_2 = {
    # lose
    "A X": 3 + 0,
    "B X": 1 + 0,
    "C X": 2 + 0,
    # draw
    "A Y": 1 + 3,
    "B Y": 2 + 3,
    "C Y": 3 + 3,
    # win
    "A Z": 2 + 6,
    "B Z": 3 + 6,
    "C Z": 1 + 6,
}

lines = [line.strip() for line in open("input", "r")]

score_part_1 = 0
score_part_2 = 0

for play in lines:
    match_1 = part_1[play]
    match_2 = part_2[play]
    print(f"{play}: {match_1} / {match_2}")
    score_part_1 += match_1
    score_part_2 += match_2
print(score_part_1)
print(score_part_2)

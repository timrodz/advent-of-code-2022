lines = [l.strip() for l in open("input", "r")]

total_completely_overlapping_pairs = 0
total_slightly_overlapping_pairs = 0

for l in lines:
    pair_a, pair_b = [l.split("-") for l in l.split(",")]

    print(f">>> a {pair_a} | b {pair_b}")

    min_a, max_a = [int(p) for p in pair_a]
    min_b, max_b = [int(p) for p in pair_b]

    a_set = set(range(min_a, max_a + 1))
    b_set = set(range(min_b, max_b + 1))

    # part 1
    if a_set.issubset(b_set) or a_set.issuperset(b_set):
        print(f"one set is fully contained")
        total_completely_overlapping_pairs += 1

    # part 2
    if any([num in b_set for num in a_set]):
        total_slightly_overlapping_pairs += 1

print(total_completely_overlapping_pairs)
print(total_slightly_overlapping_pairs)

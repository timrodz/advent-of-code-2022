lines = [l.strip() for l in open("input", "r")]


def find_first_n_unique_characters(word: str, distinct_characters: int) -> int:
    for index, _ in enumerate(word):
        combo = word[index : index + distinct_characters]
        if len(set(combo)) == distinct_characters:
            return index + distinct_characters


for data_stream in lines:
    # Part 1
    print(find_first_n_unique_characters(data_stream, 4))
    # Part 2
    print(find_first_n_unique_characters(data_stream, 14))

import typing


def find_item_type(group: typing.List) -> str:
    """
    returns the character that repeats itself in the entire list
    """
    common = set(group[0]).intersection(*group)
    assert len(common) == 1, f"expected 1 common char, got {len(common)}"
    return common.pop()


def get_item_type_value(item_type: str) -> int:
    """
    converts a char to int via the ord function
    value ranges:
    a-z: 1-26
    A-Z: 27-52
    """
    offset = -38 if item_type.isupper() else -96
    return ord(item_type) + offset


def part_1(test: bool = True) -> int:
    lines = [line.strip() for line in open("demo_input" if test else "input", "r")]
    total_sum = 0

    for rucksack in lines:
        compartment_size = len(rucksack) // 2
        compartment_a = rucksack[0:compartment_size]
        compartment_b = rucksack[compartment_size:]
        shared_item_type = find_item_type([compartment_a, compartment_b])
        value = get_item_type_value(shared_item_type)

        print(
            f">>> rucksack {rucksack} | size {compartment_size}\nc1 {compartment_a} | c2 {compartment_b} | shared type {shared_item_type} ({value})"
        )
        total_sum += value

    print(f"total sum {total_sum}")
    return total_sum


def split_list(list: typing.List[typing.Any], size: int) -> typing.List[typing.Any]:
    for i in range(0, len(list), size):
        yield list[i : i + size]


def part_2(test: bool = True) -> int:

    total_sum = 0

    lines = [line.strip() for line in open("demo_input" if test else "input", "r")]

    grouped_lines = list(split_list(lines, 6))

    for line in grouped_lines:
        group_1 = line[0:3]
        group_2 = line[3:]

        group_1_type = find_item_type(group_1)
        group_2_type = find_item_type(group_2)

        print(f">>> g1 {group_1} | {group_1_type}\ng2 {group_2} | {group_2_type}")

        total_sum += get_item_type_value(group_1_type) + get_item_type_value(
            group_2_type
        )

    print(f"total sum {total_sum}")


part_1(test=False)
part_2(test=False)

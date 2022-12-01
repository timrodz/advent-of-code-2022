"""
https://adventofcode.com/2022/day/1
"""

import typing
from formatted_input import input


def get_highest_calorie_elves(
    elves: typing.List[typing.List[int]],
) -> typing.Tuple[int, int]:
    # Compute the sum of all elf calories
    elf_calorie_sums = [sum(e) for e in elves]
    # Sort by highest to lowest
    elf_calorie_sums.sort(reverse=True)
    # Returns a tuple of the highest value, followed by sum of the 3 highest values
    return elf_calorie_sums[0], sum(elf_calorie_sums[0:3])


# Example input from the site
test_input = [[1000, 2000, 3000], [4000], [5000, 6000], [7000, 8000, 9000], [10000]]
print(get_highest_calorie_elves(test_input))

# Actual input
print(get_highest_calorie_elves(input))

import typing


lines = [l.strip('\n') for l in open('input', 'r')]


def print_stacks(stacks: typing.Dict[int, typing.List], only_top_values: bool = False) -> None:
    if only_top_values:
        result = [v[0][1] for _, v in stacks.items()]
        print("".join(result))
    else:
        for k, v in stacks.items():
            print(k, v)


empty_space_index = 0


# Find the empty line
for index, line in enumerate(lines):
    if len(line) == 0:
        empty_space_index = index
        break

stack_definition = lines[0:empty_space_index-1]
instructions = lines[empty_space_index + 1:]


def populate_stacks() -> typing.Dict[int, typing.List]:
    # generate the stacks minus the empty spaces in the prompt
    stacks = {int(l): [] for l in lines[empty_space_index-1] if l != ' '}
    for sd in stack_definition.copy():
        line = list(sd)

        # Replace every 4th whitespace with a - for easier string manipulation
        for j in range(3, len(line), 4):
            line[j] = '-'
        
        val = "".join(line).split('-')
        
        for i, v in enumerate(val):
            if v == '   ':
                continue
            stacks[i+1].extend([v])

    print_stacks(stacks)
    return stacks


def process_stacks(stacks: typing.Dict[int, typing.List], reverse: bool = False) -> None:
    for instruction in instructions.copy():
        _, amount, _, source, _, target = instruction.split()
        source_stack = stacks[int(source)]
        target_stack = stacks[int(target)]
        items_to_move = reversed(source_stack[:int(amount)]) if reverse else source_stack[:int(amount)]

        for item in items_to_move:
            target_stack.insert(0, item)
            source_stack.remove(item)
            
        print(f">>> move {amount} from {source_stack} to {target_stack}")
        print_stacks(stacks)



def part_1():
    stacks = populate_stacks()
    process_stacks(stacks)
    print_stacks(stacks, only_top_values=True)


def part_2():
    stacks = populate_stacks()
    process_stacks(stacks, reverse=True)
    print_stacks(stacks, only_top_values=True)

part_1()
part_2()
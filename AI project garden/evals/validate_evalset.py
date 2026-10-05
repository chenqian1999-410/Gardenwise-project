#!/usr/bin/env python3
"""Dependency-free structural validation for the GardenWise JSONL eval set."""

import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent
EVALSET = ROOT / "gardenwise-evalset.jsonl"

REQUIRED_KEYS = {
    "id",
    "title",
    "category",
    "priority",
    "mode",
    "input",
    "expected",
    "scoring",
}
ALLOWED_KEYS = REQUIRED_KEYS | {"fixture"}
ALLOWED_CATEGORIES = {
    "coverage_math",
    "input_contract",
    "plant_selection",
    "proposal_output",
    "design_dialogue",
    "rendering",
    "interface",
    "security",
    "end_to_end",
}
ALLOWED_PRIORITIES = {"P0", "P1", "P2"}
ALLOWED_MODES = {"single_turn", "multi_turn", "implementation_review"}
ALLOWED_METHODS = {"exact", "assertion", "hybrid", "visual_review", "code_review"}


def require(condition: bool, line_number: int, message: str) -> None:
    if not condition:
        raise ValueError(f"line {line_number}: {message}")


def main() -> None:
    cases = []
    ids = set()

    for line_number, line in enumerate(EVALSET.read_text().splitlines(), 1):
        case = json.loads(line)
        require(REQUIRED_KEYS <= set(case), line_number, "missing required top-level key")
        require(set(case) <= ALLOWED_KEYS, line_number, "unknown top-level key")
        require(
            re.fullmatch(r"GW-[A-Z0-9]+-[0-9]{3}", case["id"]) is not None,
            line_number,
            "invalid case id",
        )
        require(case["id"] not in ids, line_number, f"duplicate id {case['id']}")
        require(case["category"] in ALLOWED_CATEGORIES, line_number, "invalid category")
        require(case["priority"] in ALLOWED_PRIORITIES, line_number, "invalid priority")
        require(case["mode"] in ALLOWED_MODES, line_number, "invalid mode")
        require(bool(case["input"].get("prompt")), line_number, "missing input.prompt")
        require(isinstance(case["expected"].get("must"), list), line_number, "expected.must must be a list")
        require(isinstance(case["expected"].get("mustNot"), list), line_number, "expected.mustNot must be a list")
        require(case["scoring"].get("method") in ALLOWED_METHODS, line_number, "invalid scoring method")
        require(
            isinstance(case["scoring"].get("maxPoints"), int)
            and case["scoring"]["maxPoints"] > 0,
            line_number,
            "maxPoints must be a positive integer",
        )
        require(
            isinstance(case["scoring"].get("criticalFailure"), list),
            line_number,
            "criticalFailure must be a list",
        )
        if "fixture" in case:
            require((ROOT / case["fixture"]).is_file(), line_number, "fixture does not exist")

        ids.add(case["id"])
        cases.append(case)

    priorities = Counter(case["priority"] for case in cases)
    categories = Counter(case["category"] for case in cases)
    require(all(categories[name] > 0 for name in ALLOWED_CATEGORIES), 0, "a category has no cases")
    require(priorities["P0"] > 0, 0, "no P0 release-gate cases")

    print(f"valid GardenWise eval set: {len(cases)} cases")
    print("priorities:", dict(sorted(priorities.items())))
    print("categories:", dict(sorted(categories.items())))


if __name__ == "__main__":
    main()

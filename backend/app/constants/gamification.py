XP_PER_LEVEL = 500

XP_PER_RESULT = {
    "CORRECT": 100,
    "PARTIALLY_CORRECT": 50,
    "INCORRECT": 10,
}

XP_COMPLETION_BONUS = 50


def compute_level(total_xp):
    """Level = floor(total_xp / XP_PER_LEVEL) + 1. Level 1 starts at 0 XP."""
    return (total_xp // XP_PER_LEVEL) + 1


def xp_to_next_level(total_xp):
    """XP remaining to reach the next level."""
    current_level = compute_level(total_xp)
    next_level_threshold = current_level * XP_PER_LEVEL
    return max(0, next_level_threshold - total_xp)

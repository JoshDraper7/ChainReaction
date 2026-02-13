from typing import Optional

class Cell:

    def __init__(self, count: int=0, color: Optional[int]=None, max_count: int=3) -> None:
        self.count = count
        self.color = color
        self.max_count = max_count

    def get_color(self) -> Optional[int]:
        return self.color
    
    def get_count(self) -> int:
        return self.count

    def change_color(self, color: Optional[int]) -> None:
        self.color = color

    def inc_count(self) -> bool:
        """
        Increments count in cell. If count > max_count, return True else return False.
        """
        self.count += 1
        if self.count > self.max_count:
            self.count = 0
            return True
        return False
    
    def to_dict(self) -> dict:
        return {
            "count": self.count,
            "color": self.color,
            "max_count": self.max_count,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Cell":
        return cls(
            count=data["count"],
            color=data.get("color"),
            max_count=data["max_count"],
        )


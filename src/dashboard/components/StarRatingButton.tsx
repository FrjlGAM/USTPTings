import React from "react";
import rateIcon from "../../assets/ustp thingS/Rate.png";
import rateFilledIcon from "../../assets/ustp thingS/Rate filled.png";

interface StarRatingButtonProps {
  value: number; // current rating (1-5)
  onChange: (val: number) => void;
  max?: number;
  size?: number | string;
  className?: string;
}

const StarRatingButton: React.FC<StarRatingButtonProps> = ({
  value,
  onChange,
  max = 5,
  size = 40,
  className = "",
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          tabIndex={0}
        >
          <img
            src={i < value ? rateFilledIcon : rateIcon}
            alt={i < value ? "Filled star" : "Empty star"}
            style={{ width: size, height: size, transition: "transform 0.1s" }}
            draggable={false}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRatingButton; 
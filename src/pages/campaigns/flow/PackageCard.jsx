import PropTypes from "prop-types";

function PackageCard({ item, selected, onSelect }) {
  const classes = ["flow-package", item.recommended && "flow-package--rec", selected && "flow-package--on"];
  return (
    <label className={classes.filter(Boolean).join(" ")}>
      <input type="radio" name="package" checked={selected} onChange={() => onSelect(item.id)} />
      {item.recommended && <span className="flow-package-badge">Recommended</span>}
      <span className="flow-package-name">{item.name}</span>
      <span className="flow-package-price">${item.price}</span>
      <span className="flow-package-caption">Campaign targets</span>
      <span className="flow-package-targets">
        {item.targets.map((target) => (
          <span key={target}>{target}</span>
        ))}
      </span>
    </label>
  );
}

PackageCard.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default PackageCard;

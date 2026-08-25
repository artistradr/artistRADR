import routes from "routes";

/**
 * Flattens the nested `routes.js` collapse-group structure into a flat
 * { [path]: { title, description } } map.
 */
function getSeoRoutes(routeList = routes) {
  let map = {};
  routeList.forEach((entry) => {
    if (entry.collapse) {
      map = { ...map, ...getSeoRoutes(entry.collapse) };
    } else if (entry.route) {
      map[entry.route] = {
        title: entry.name,
        description: entry.description || `${entry.name} — Artist RADR`,
      };
    }
  });
  return map;
}

export default getSeoRoutes();
export const routeKey = (route) =>
  [
    route.owner,
    route.container_type,
    route.container_size,
    route.legs
      .map((leg) => `${leg.mode}-${leg.from_location}-${leg.to_location}`)
      .join("|"),
  ].join("__");

export const calculateServiceExtra = (services, selectedIndices) => {
  return selectedIndices.reduce((sum, idx) => sum + (services[idx]?.price || 0), 0);
};

const builds: Record<string, boolean> = {};

export const isBuilt = (modelName: string) => {
  return !!builds[modelName];
};

export const markBuild = (modelName: string) => {
  builds[modelName] = true;
};

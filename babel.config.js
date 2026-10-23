module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Les migrations Drizzle (.sql) sont embarquées dans le bundle.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};

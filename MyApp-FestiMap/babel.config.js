module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      // Reanimated siempre debe ir al final de la lista de plugins
      'react-native-reanimated/plugin',
    ],
  };
};
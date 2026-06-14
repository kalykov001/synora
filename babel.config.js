module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [require.resolve('expo/internal/babel-preset'), { jsxImportSource: "nativewind" }],
      require.resolve('nativewind/babel'),
    ],
    plugins: [
      require.resolve('react-native-reanimated/plugin'),
    ],
  };
};

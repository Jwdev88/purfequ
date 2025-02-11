// babel.config.js
export default { // Ganti module.exports dengan export default
    presets: [
      '@babel/preset-env',
      '@babel/preset-react',
    ],
    plugins: [
      '@babel/plugin-transform-runtime',
    ],
  };
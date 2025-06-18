/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: [
    'app/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'features/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
  ],
  project: ['tsconfig.json'],
  ignore: ['.next/**', '**/*.test.*', '**/__tests__/**', '**/*.stories.*'],
  include: [
    'files',
    'exports',
    'types',
    'classMembers',
    'enumMembers',
    'nsExports',
    'nsTypes',
    'duplicates'
  ]
};
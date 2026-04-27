module.exports = async () => {
  // Global teardown logic if needed (e.g. closing servers that stick around)
  // Most cleanup is handled in setup.ts afterAll
  console.log('Global test teardown complete.');
};

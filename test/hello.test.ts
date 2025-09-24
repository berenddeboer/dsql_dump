// Basic test to ensure the package can be imported
describe('dsql_dump', () => {
  test('basic import test', async () => {
    // Just test that we can import the main module without errors
    const module = await import('../src');
    expect(module).toBeDefined();
  });
});
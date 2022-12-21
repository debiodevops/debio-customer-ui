export async function queryLastGeneticAnalysisOrderByCustomer(api, accountId) {
  const res = await api.query.geneticAnalysisOrders.lastGeneticAnalysisOrderByCustomer(accountId)
  return res.toHuman()
}

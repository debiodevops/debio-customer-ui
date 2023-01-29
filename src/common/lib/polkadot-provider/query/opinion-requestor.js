export async function queryOpinionRequestorByOwner(api, accountId) {
  const res = await api.query.opinionRequestor.opinionRequestorByOwner(accountId)
  return res.toHuman()
}

export async function queryOpinionRequestor(api, id) {
  const res = await api.query.opinionRequestor.opinionRequestors(id)
  return res.toHuman()
}

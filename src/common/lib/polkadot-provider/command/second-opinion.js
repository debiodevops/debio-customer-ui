export async function postRequestOpinion(api, pair, info) {
  const result = await api.tx.opinionRequestor
    .requestOpinion(info)
    .signAndSend(pair, {nonce: -1})
  return result.toHuman()
}

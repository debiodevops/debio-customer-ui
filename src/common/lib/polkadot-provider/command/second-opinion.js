function successCallback(api, { events, status, callback, unsub }) {
  if (status.isFinalized) {
    // Filter for success events
    const eventList = events.filter(({ event }) => api.events.system.ExtrinsicSuccess.is(event));
    if (eventList.length > 0) {
      if (callback) callback(); // If callback not undefined
      unsub();
    }
  }
}

export async function postRequestOpinion(api, pair, info, callback) {
  const unsub = await api.tx.opinionRequestor
    .requestOpinion(info)
    .signAndSend(pair, { nonce: -1},
      ({ events, status}) => {
        successCallback(api, { events, status, callback, unsub });
      }
    )
}

import Web3 from "web3"

export async function fromEther(balance) {
  const formatedBalance = Web3.utils.fromWei(String(balance), "ether")
  return formatedBalance
}

export async function toEther(balance) {
  return Web3.utils.toWei(String(balance), "ether")
}

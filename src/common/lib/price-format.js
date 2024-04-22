import Web3 from "web3"

export function formatPrice(price, currency) {
  let unit
  currency === "USDT" || currency === "USDTE" || currency === "USDTE" ? unit = "mwei" : unit = "ether"
  const formatedPrice = Web3.utils.fromWei(String(price.replaceAll(",", "")), unit)
  return Number(formatedPrice).toLocaleString("en-US")
}

export function formatUSDTE(currency) {
  if (currency === "USDT.e") return "USDTE"
  if (currency === "USDTE") return "USDT.e"
  return currency
}

export async function errorHandler(err) {
  let error 

  switch (err) {
  case "Insufficient Balance":
  case "1010: Invalid Transaction: Inability to pay some fees , e.g. account balance too low":
    error = {
      title: "Insufficient Balance",
      message: "Your transaction cannot go through because your account balance is too low or doesn't meet the minimum deposit needed. Please check your balance."
    }
    break;
  case "MetaMask Tx Signature: User denied transaction signature.":
    error = {
      title: "Transaction Rejected",
      message: "Metamask failed to proceed your transaction, confirm the transaction and make sure you are paying enough transaction weight!"
    }
    break;
  default : error = {
    title: "Error",
    message: err
  }
    break
  }
  return error
}

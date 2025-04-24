import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/KarmaToken/KarmaToken";
import { Token, Account, Transfer } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let token = Token.load("1");
  if (!token) {
    token = new Token("1");
    token.name = "Karma Token";
    token.symbol = "KARMA";
    token.decimals = 18;
    token.totalSupply = BigInt.fromI32(0);
  }
  token.save();

  let fromAccount = Account.load(event.params.from.toHexString());
  if (!fromAccount) {
    fromAccount = new Account(event.params.from.toHexString());
    fromAccount.balance = BigInt.fromI32(0);
  }
  fromAccount.balance = fromAccount.balance.minus(event.params.value);
  fromAccount.save();

  let toAccount = Account.load(event.params.to.toHexString());
  if (!toAccount) {
    toAccount = new Account(event.params.to.toHexString());
    toAccount.balance = BigInt.fromI32(0);
  }
  toAccount.balance = toAccount.balance.plus(event.params.value);
  toAccount.save();

  let transfer = new Transfer(event.transaction.hash.concatI32(event.logIndex.toI32()));
  transfer.from = fromAccount.id;
  transfer.to = toAccount.id;
  transfer.value = event.params.value;
  transfer.blockNumber = event.block.number;
  transfer.blockTimestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
} 
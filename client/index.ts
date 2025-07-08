import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ATXGFP91aG7J4wGW89Z5Me13ki3ZNAfLxgAe86zemZDR");
const conn = new Connection("http://127.0.0.1:8899", "confirmed");

(async () => {
  const user = Keypair.generate();

  // Airdrop
  const sig = await conn.requestAirdrop(user.publicKey, 1_000_000_000);
  await conn.confirmTransaction(sig);
  console.log("💰 Airdrop complete. Balance:", await conn.getBalance(user.publicKey));

  // Derive PDA
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [user.publicKey.toBuffer(), Buffer.from("user")],
    PROGRAM_ID
  );
  console.log("📦 Derived PDA:", pda.toBase58());

  // Instruction
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: user.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });

  const tx = new Transaction().add(ix);

  // Optional: Simulate first
  const { value: sim } = await conn.simulateTransaction(tx, [user]);
  console.log("🧪 Simulated logs:", sim?.logs ?? []);

  // Send TX
  const txSig = await sendAndConfirmTransaction(conn, tx, [user]);
  console.log("✅ Transaction sent:", txSig);

  // Get logs
  const final = await conn.getTransaction(txSig, { commitment: "confirmed" });
  console.log("📄 Final logs:", final?.meta?.logMessages ?? []);
})();

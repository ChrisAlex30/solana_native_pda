use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction::create_account,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("🔐 Program entry");

    let iter = &mut accounts.iter();

    let pda = next_account_info(iter)?;            // PDA account
    let user_account = next_account_info(iter)?;   // Payer
    let system_program = next_account_info(iter)?; // System program

    let seeds = &[user_account.key.as_ref(), b"user"];
    let (pda_pubkey, bump) = Pubkey::find_program_address(seeds, program_id);

    msg!("🧪 Checking PDA");
    if *pda.key != pda_pubkey {
        msg!("❌ Invalid PDA! Expected: {}", pda_pubkey);
        return Err(ProgramError::InvalidSeeds);
    }

    // Check if PDA already exists
    if pda.lamports() > 0 {
        msg!("⚠️ PDA already exists, skipping creation");
        return Ok(());
    }

    msg!("🚀 Creating PDA account");

    let signer_seeds: &[&[u8]] = &[user_account.key.as_ref(), b"user", &[bump]];
    let lamports = 1_000_000; // small amount for testing
    let space = 8;

    let ix = create_account(user_account.key, pda.key, lamports, space, program_id);

    invoke_signed(
        &ix,
        &[user_account.clone(), pda.clone(), system_program.clone()],
        &[signer_seeds],
    )?;

    msg!("✅ PDA created successfully");

    Ok(())
}

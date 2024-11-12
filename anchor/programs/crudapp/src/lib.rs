#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("9GWD1yFsuxvCDKWCAr3pzX1rgkGViKGtBEeo6tcTkD1C");

#[program]
pub mod crudapp {
    use super::*;

    pub fn create_journal_entry(ctx: Context<CreateJournalEntry>, title: String, message: String) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry; // Loading in account as mutable bc we need to update its state when saving title and message
        journal_entry.owner = *ctx.accounts.owner.key;
        journal_entry.title = title;
        journal_entry.message = message;

        Ok(())
    }

    pub fn update_journal_entry(ctx: Context<UpdateJournalEntry>, _title: String, message: String) -> Result<()> {
       let journal_entry = &mut ctx.accounts.journal_entry;
       journal_entry.message = message;

       Ok(())
    }

    pub fn delete_journal_entry(_ctx: Context<DeleteJournalEntry>, _title: String) -> Result<()> {
      Ok(()) // Entry/Account will be deleted following the close clause specified in the macro
    }
}

#[account]
#[derive(InitSpace)]
pub struct JournalEntryState {
  pub owner: Pubkey, //Owner of the journal
  #[max_len(50)]
  pub title: String,
  #[max_len(1000)]
  pub message: String
}



#[derive(Accounts)]
#[instruction(title: String)] // Macro for specifying that some arguments of the instructions should be used int the context
pub struct CreateJournalEntry<'info> {
  #[account(
    init,
    seeds = [title.as_bytes(), owner.key().as_ref()],
    bump,
    space = 8 + JournalEntryState::INIT_SPACE,
    payer = owner
  )]
  pub journal_entry: Account<'info, JournalEntryState>,

  #[account(mut)] // As the owner will be paying for creating the account, we would
  // be updating the owners account, thus mutating its state. Meaning that we need to make it
  // mutable as in Rust all variables are inmutable by default
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>

}

#[derive(Accounts)]
#[instruction(title: String, message: String)]
pub struct UpdateJournalEntry<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        realloc = 8 + 32 + 4 + title.len() + 4 + message.len(),
        realloc::payer = owner,
        realloc::zero = true,
    )]
    pub journal_entry: Account<'info, JournalEntryState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteJournalEntry<'info>{
  #[account(
    mut,
    seeds = [title.as_bytes(), owner.key().as_ref()],
    bump,
    close = owner // This instruction will close the account
    //only if the public key that owns the account is the one signing the transactions
  )]
  pub journal_entry: Account<'info, JournalEntryState>,
  #[account(mut)]
  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>
}



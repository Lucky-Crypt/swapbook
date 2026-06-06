#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    OfferNotFound = 1,
    OfferNotActive = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Offer {
    pub id: u64,
    pub creator: Address,
    pub token_a: Address,
    pub amount_a: i128,
    pub token_b: Address,
    pub amount_b: i128,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    OfferCount,
    Offer(u64),
}

#[contract]
pub struct Swapbook;

#[contractimpl]
impl Swapbook {
    /// Creates a new swap offer. The creator deposits `amount_a` of `token_a` into the contract.
    pub fn create_offer(
        env: Env,
        creator: Address,
        token_a: Address,
        amount_a: i128,
        token_b: Address,
        amount_b: i128,
    ) -> u64 {
        creator.require_auth();

        // Transfer token_a from the creator to the contract
        let token_client = token::Client::new(&env, &token_a);
        token_client.transfer(&creator, &env.current_contract_address(), &amount_a);

        // Get and increment the offer count
        let mut id: u64 = env.storage().instance().get(&DataKey::OfferCount).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::OfferCount, &id);

        // Store the offer
        let offer = Offer {
            id,
            creator,
            token_a,
            amount_a,
            token_b,
            amount_b,
            active: true,
        };
        env.storage().persistent().set(&DataKey::Offer(id), &offer);

        id
    }

    /// Fills an active swap offer. The filler pays `amount_b` of `token_b` to the creator,
    /// and receives `amount_a` of `token_a` from the contract.
    pub fn fill_offer(env: Env, filler: Address, offer_id: u64) -> Result<(), Error> {
        filler.require_auth();

        let mut offer: Offer = env
            .storage()
            .persistent()
            .get(&DataKey::Offer(offer_id))
            .ok_or(Error::OfferNotFound)?;

        if !offer.active {
            return Err(Error::OfferNotActive);
        }

        // Pay token_b from filler directly to the creator
        let token_b_client = token::Client::new(&env, &offer.token_b);
        token_b_client.transfer(&filler, &offer.creator, &offer.amount_b);

        // Send token_a from contract to the filler
        let token_a_client = token::Client::new(&env, &offer.token_a);
        token_a_client.transfer(&env.current_contract_address(), &filler, &offer.amount_a);

        // Mark offer as inactive
        offer.active = false;
        env.storage().persistent().set(&DataKey::Offer(offer_id), &offer);

        Ok(())
    }

    /// Retrieves an offer by ID
    pub fn get_offer(env: Env, offer_id: u64) -> Option<Offer> {
        env.storage().persistent().get(&DataKey::Offer(offer_id))
    }

    /// Retrieves all offers (Note: In production this should be paginated)
    pub fn get_all_offers(env: Env) -> Vec<Offer> {
        let mut offers = Vec::new(&env);
        let count: u64 = env.storage().instance().get(&DataKey::OfferCount).unwrap_or(0);
        
        for i in 1..=count {
            if let Some(offer) = env.storage().persistent().get::<_, Offer>(&DataKey::Offer(i)) {
                offers.push_back(offer);
            }
        }
        offers
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_create_and_fill_offer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, Swapbook);
        let client = SwapbookClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let filler = Address::generate(&env);

        let token_a_admin = Address::generate(&env);
        let token_b_admin = Address::generate(&env);

        let token_a = env.register_stellar_asset_contract_v2(token_a_admin.clone()).address();
        let token_b = env.register_stellar_asset_contract_v2(token_b_admin.clone()).address();

        let token_a_client = token::StellarAssetClient::new(&env, &token_a);
        let token_b_client = token::StellarAssetClient::new(&env, &token_b);

        token_a_client.mint(&creator, &1000);
        token_b_client.mint(&filler, &2000);

        let offer_id = client.create_offer(&creator, &token_a, &1000, &token_b, &2000);
        assert_eq!(offer_id, 1);

        assert_eq!(token::Client::new(&env, &token_a).balance(&creator), 0);
        assert_eq!(token::Client::new(&env, &token_a).balance(&contract_id), 1000);

        client.fill_offer(&filler, &offer_id);

        assert_eq!(token::Client::new(&env, &token_a).balance(&filler), 1000);
        assert_eq!(token::Client::new(&env, &token_b).balance(&creator), 2000);
    }
}

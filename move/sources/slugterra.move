module slugterra::game {
    use std::string::{String};
    use sui::coin::{Coin};
    use sui::sui::SUI;
    use sui::balance::{Balance};
    use sui::dynamic_object_field as dof;
    use sui::clock::{Clock};
    use sui::hash::{blake2b256};
    use sui::random::{Self, Random};
    use sui::event;

    // --- Constants & Error Codes ---
    const ELEMENT_FIRE: u8 = 1;
    const ELEMENT_WATER: u8 = 2;
    const ELEMENT_EARTH: u8 = 3;
    const ELEMENT_AIR: u8 = 4;

    const ELEMENT_SHADOW_FIRE: u8 = 5;
    const ELEMENT_SHADOW_WATER: u8 = 6;
    const ELEMENT_SHADOW_EARTH: u8 = 7;
    const ELEMENT_SHADOW_AIR: u8 = 8;

    const E_INSUFFICIENT_FUNDS: u64 = 0;
    const E_INVALID_ELEMENT: u64 = 1;
    const E_MAX_LEVEL: u64 = 2;
    const E_INVALID_WAGER: u64 = 5;
    const E_UNAUTHORIZED: u64 = 6;
    const E_LOBBY_NOT_FULL: u64 = 7;
    const E_LOBBY_FULL: u64 = 8;
    const E_INVALID_HASH: u64 = 9;
    const E_TIMEOUT_NOT_REACHED: u64 = 10;
    const E_ALREADY_GHOULED: u64 = 11;
    const E_COOLDOWN: u64 = 12;

    // --- Struct Definitions ---

    public struct Slug has key, store {
        id: UID,
        name: String,
        element: u8,
        power: u64,
        is_ghouled: bool,
        win_count: u64,
        rarity: u8,       // 1=Common, 2=Rare, 3=Epic, 4=Legendary
        level: u64,       // Level 1 to 100
        is_hybrid: bool,
        last_level_up_ms: u64,
    }

    public struct MarketplaceConfig has key {
        id: UID,
        premium_mint_price: u64, // SUI price in MIST (e.g. 1 SUI)
        vault: Balance<SUI>,
    }

    public struct PvpLobby has key {
        id: UID,
        player1: address,
        slug1_hash: vector<u8>, // sha256(slug_id_bytes + salt_bytes)
        player2: address,
        slug2_id: ID,
        slug2_power: u64,
        slug2_element: u8,
        slug2_is_ghouled: bool,
        wager_amount: u64,
        pool: Balance<SUI>,
        join_time_ms: u64, // timestamp when player 2 joined
    }

    public struct AdminCap has key, store {
        id: UID,
    }

    // --- Events ---
    public struct BattleResolved has copy, drop {
        lobby_id: ID,
        winner: address,
        payout: u64,
        slug1_id: ID,
        slug2_id: ID,
    }

    // --- Core Functions ---

    fun init(ctx: &mut TxContext) {
        let config = MarketplaceConfig {
            id: object::new(ctx),
            premium_mint_price: 1_000_000_000, // 1 SUI
            vault: sui::balance::zero(),
        };
        transfer::share_object(config);

        let admin = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin, ctx.sender());
    }

    // --- Tier-Based Minting Functions ---

    public entry fun free_mint(
        name: String, 
        element: u8, 
        r: &Random, 
        ctx: &mut TxContext
    ) {
        assert!(element >= 1 && element <= 4, E_INVALID_ELEMENT);

        // Rarity distribution: 75% Common, 20% Rare, 4.5% Epic, 0.5% Legendary
        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u32_in_range(&mut generator, 0, 999); 
        let mut rarity: u8 = 1; // Default Common
        let mut base_power: u64 = 10;

        if (roll >= 995) { // 0.5% chance
            rarity = 4; // Legendary
            base_power = 25;
        } else if (roll >= 950) { // 4.5% chance
            rarity = 3; // Epic
            base_power = 20;
        } else if (roll >= 750) { // 20% chance
            rarity = 2; // Rare
            base_power = 15;
        };

        let slug = Slug {
            id: object::new(ctx),
            name,
            element,
            power: base_power,
            is_ghouled: false,
            win_count: 0,
            rarity,
            level: 1,
            is_hybrid: false,
            last_level_up_ms: 0,
        };
        transfer::public_transfer(slug, ctx.sender());
    }

    public entry fun premium_mint(
        config: &mut MarketplaceConfig,
        name: String, 
        element: u8, 
        r: &Random,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(element >= 1 && element <= 4, E_INVALID_ELEMENT);
        let price = config.premium_mint_price;
        assert!(payment.value() >= price, E_INSUFFICIENT_FUNDS);

        let paid_coin = payment.split(price, ctx);
        config.vault.join(paid_coin.into_balance());

        if (payment.value() > 0) {
            transfer::public_transfer(payment, ctx.sender());
        } else {
            payment.destroy_zero();
        };

        // Rarity distribution: 40% Common, 45% Rare, 12% Epic, 3% Legendary
        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u32_in_range(&mut generator, 0, 99); 
        let mut rarity: u8 = 1; 
        let mut base_power: u64 = 10;

        if (roll >= 97) { // 3% chance
            rarity = 4; 
            base_power = 25;
        } else if (roll >= 85) { // 12% chance
            rarity = 3; 
            base_power = 20;
        } else if (roll >= 40) { // 45% chance
            rarity = 2; 
            base_power = 15;
        };

        let slug = Slug {
            id: object::new(ctx),
            name,
            element,
            power: base_power,
            is_ghouled: false,
            win_count: 0,
            rarity,
            level: 1,
            is_hybrid: false,
            last_level_up_ms: 0,
        };
        transfer::public_transfer(slug, ctx.sender());
    }

    // --- Mutation / Ghouling ---
    public entry fun buy_dark_water_and_upgrade(
        config: &mut MarketplaceConfig,
        slug: &mut Slug,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(!slug.is_ghouled, E_ALREADY_GHOULED);
        let price = config.premium_mint_price;
        assert!(payment.value() >= price, E_INSUFFICIENT_FUNDS);
        let paid_coin = payment.split(price, ctx);
        config.vault.join(paid_coin.into_balance());
        if (payment.value() > 0) {
            transfer::public_transfer(payment, ctx.sender());
        } else {
            payment.destroy_zero();
        };

        slug.is_ghouled = true;
        slug.power = slug.power + 25; 
        if (slug.element == ELEMENT_FIRE) { slug.element = ELEMENT_SHADOW_FIRE; }
        else if (slug.element == ELEMENT_EARTH) { slug.element = ELEMENT_SHADOW_EARTH; }
        else if (slug.element == ELEMENT_WATER) { slug.element = ELEMENT_SHADOW_WATER; }
        else if (slug.element == ELEMENT_AIR) { slug.element = ELEMENT_SHADOW_AIR; };
    }

    // --- Level Up (Simplified Economy) ---
    public entry fun level_up(slug: &mut Slug, clock: &Clock, _: &mut TxContext) {
        assert!(slug.level < 100, E_MAX_LEVEL);
        let current_time = sui::clock::timestamp_ms(clock);
        assert!(current_time > slug.last_level_up_ms + 86_400_000, E_COOLDOWN);
        slug.level = slug.level + 1;
        slug.power = slug.power + 5; 
        slug.last_level_up_ms = current_time;
    }

    // --- Object Wrapping Fusion ---
    // Instead of destroying parent slugs, they are hibernated using dynamic_object_field
    public entry fun fuse_slugs(
        parent1: Slug,
        parent2: Slug,
        hybrid_name: String,
        ctx: &mut TxContext
    ) {
        // Find highest rarity
        let mut final_rarity = parent1.rarity;
        if (parent2.rarity > final_rarity) { final_rarity = parent2.rarity; };

        // Inherit 80% of max power to prevent massive power creep
        let mut max_power = parent1.power;
        if (parent2.power > max_power) { max_power = parent2.power; };
        let inherited_power = (max_power * 80) / 100;
        let final_power = inherited_power + 8; // +8 base fusion bonus

        let mut hybrid = Slug {
            id: object::new(ctx),
            name: hybrid_name,
            element: parent1.element, // Primary element
            power: final_power,
            is_ghouled: parent1.is_ghouled || parent2.is_ghouled,
            win_count: parent1.win_count + parent2.win_count,
            rarity: final_rarity,
            level: 1,
            is_hybrid: true,
            last_level_up_ms: 0,
        };

        // Wrap parents as dynamic object fields so they are not destroyed
        dof::add(&mut hybrid.id, b"parent1", parent1);
        dof::add(&mut hybrid.id, b"parent2", parent2);

        transfer::public_transfer(hybrid, ctx.sender());
    }

    // --- PVP COMMIT-REVEAL MATCHMAKING ---

    // Phase 1: Player 1 creates lobby with a hash of their slug+salt
    public entry fun create_pvp_lobby(
        slug_hash: vector<u8>,
        mut wager: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let wager_amount = wager.value();
        assert!(wager_amount == 1_000_000_000 || wager_amount == 5_000_000_000 || wager_amount == 10_000_000_000, E_INVALID_WAGER);

        let lobby = PvpLobby {
            id: object::new(ctx),
            player1: ctx.sender(),
            slug1_hash: slug_hash,
            player2: @0x0,
            slug2_id: object::id_from_address(@0x0),
            slug2_power: 0,
            slug2_element: 0,
            slug2_is_ghouled: false,
            wager_amount,
            pool: wager.into_balance(),
            join_time_ms: 0,
        };
        transfer::share_object(lobby);
    }

    public entry fun cancel_pvp_lobby(lobby: PvpLobby, ctx: &mut TxContext) {
        assert!(ctx.sender() == lobby.player1, E_UNAUTHORIZED);
        assert!(lobby.player2 == @0x0, E_LOBBY_FULL); // Cannot cancel if P2 joined
        
        let PvpLobby { id, player1: _, slug1_hash: _, player2: _, slug2_id: _, slug2_power: _, slug2_element: _, slug2_is_ghouled: _, wager_amount: _, pool, join_time_ms: _ } = lobby;
        let coin = pool.into_coin(ctx);
        transfer::public_transfer(coin, ctx.sender());
        object::delete(id);
    }

    // Phase 2: Player 2 joins the lobby, locking their wager and revealing their slug details
    public entry fun join_pvp_lobby(
        lobby: &mut PvpLobby,
        slug2: &Slug,
        clock: &Clock,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(lobby.player2 == @0x0, E_LOBBY_FULL);
        let wager_amount = lobby.wager_amount;
        assert!(payment.value() >= wager_amount, E_INSUFFICIENT_FUNDS);

        let paid_coin = payment.split(wager_amount, ctx);
        lobby.pool.join(paid_coin.into_balance());

        if (payment.value() > 0) { transfer::public_transfer(payment, ctx.sender()); } 
        else { payment.destroy_zero(); };

        lobby.player2 = ctx.sender();
        lobby.slug2_id = object::id(slug2);
        lobby.slug2_power = slug2.power;
        lobby.slug2_element = slug2.element;
        lobby.slug2_is_ghouled = slug2.is_ghouled;
        lobby.join_time_ms = sui::clock::timestamp_ms(clock);
    }

    // Phase 3: Player 1 reveals their slug + salt to resolve the battle
    public entry fun resolve_pvp_lobby(
        lobby: PvpLobby,
        slug1: &mut Slug,
        salt: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == lobby.player1, E_UNAUTHORIZED);
        assert!(lobby.player2 != @0x0, E_LOBBY_NOT_FULL);

        // Verify the hash: sha256(slug_id_bytes + salt_bytes)
        let slug1_id_bytes = sui::object::id_to_bytes(&sui::object::id(slug1));
        let mut payload = slug1_id_bytes;
        std::vector::append(&mut payload, salt);
        let computed_hash = blake2b256(&payload);
        assert!(computed_hash == lobby.slug1_hash, E_INVALID_HASH);

        let mut score1 = slug1.power;
        let mut score2 = lobby.slug2_power;
        let el1 = slug1.element;
        let el2 = lobby.slug2_element;

        if (el1 == ELEMENT_WATER && el2 == ELEMENT_FIRE) { score1 = score1 + 6; }
        else if (el1 == ELEMENT_FIRE && el2 == ELEMENT_AIR) { score1 = score1 + 6; }
        else if (el1 == ELEMENT_AIR && el2 == ELEMENT_EARTH) { score1 = score1 + 6; }
        else if (el1 == ELEMENT_EARTH && el2 == ELEMENT_WATER) { score1 = score1 + 6; };

        if (el2 == ELEMENT_WATER && el1 == ELEMENT_FIRE) { score2 = score2 + 6; }
        else if (el2 == ELEMENT_FIRE && el1 == ELEMENT_AIR) { score2 = score2 + 6; }
        else if (el2 == ELEMENT_AIR && el1 == ELEMENT_EARTH) { score2 = score2 + 6; }
        else if (el2 == ELEMENT_EARTH && el1 == ELEMENT_WATER) { score2 = score2 + 6; };

        if (slug1.is_ghouled && el2 <= 4) { score1 = score1 + 8; };
        if (lobby.slug2_is_ghouled && el1 <= 4) { score2 = score2 + 8; };

        let player1_wins = score1 >= score2;
        let winner_address = if (player1_wins) { lobby.player1 } else { lobby.player2 };

        if (player1_wins) {
            slug1.win_count = slug1.win_count + 1;
        };

        let PvpLobby { id, player1: _, slug1_hash: _, player2: _, slug2_id, slug2_power: _, slug2_element: _, slug2_is_ghouled: _, wager_amount: _, pool, join_time_ms: _ } = lobby;
        
        let payout_value = sui::balance::value(&pool);
        let payout = pool.into_coin(ctx);
        transfer::public_transfer(payout, winner_address);

        event::emit(BattleResolved {
            lobby_id: sui::object::uid_to_inner(&id),
            winner: winner_address,
            payout: payout_value,
            slug1_id: sui::object::id(slug1),
            slug2_id,
        });

        sui::object::delete(id);
    }

    // Phase 4: Anti-Griefing Timeout. If Player 1 doesn't reveal within 5 mins, Player 2 claims the pot
    public entry fun claim_timeout(
        lobby: PvpLobby,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == lobby.player2, E_UNAUTHORIZED);
        // 2 minutes = 120,000 ms
        assert!(sui::clock::timestamp_ms(clock) > lobby.join_time_ms + 120_000, E_TIMEOUT_NOT_REACHED);

        let PvpLobby { id, player1: _, slug1_hash: _, player2: _, slug2_id: _, slug2_power: _, slug2_element: _, slug2_is_ghouled: _, wager_amount: _, pool, join_time_ms: _ } = lobby;
        
        let payout = pool.into_coin(ctx);
        transfer::public_transfer(payout, ctx.sender());
        sui::object::delete(id);
    }

    public entry fun withdraw_royalties(
        _: &AdminCap, 
        config: &mut MarketplaceConfig, 
        amount: u64, 
        ctx: &mut TxContext
    ) {
        let coin = config.vault.split(amount).into_coin(ctx);
        transfer::public_transfer(coin, ctx.sender());
    }
}

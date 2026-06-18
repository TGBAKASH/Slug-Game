module slugterra::game {
    use std::string::{Self, String};
    use sui::coin::{Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::{Clock};
    use sui::hash::{blake2b256};
    use sui::random::{Self, Random};
    use sui::event;
    use sui::table::{Self, Table};

    // ─── Element Constants ───
    const ELEMENT_FIRE: u8 = 1;
    const ELEMENT_WATER: u8 = 2;
    const ELEMENT_EARTH: u8 = 3;
    const ELEMENT_AIR: u8 = 4;

    // ─── Base Stats per Element ───
    const FIRE_HP: u64 = 85;
    const FIRE_ATK: u64 = 20;
    const WATER_HP: u64 = 120;
    const WATER_ATK: u64 = 14;
    const EARTH_HP: u64 = 130;
    const EARTH_ATK: u64 = 10;
    const AIR_HP: u64 = 105;
    const AIR_ATK: u64 = 16;

    // ─── Error Codes ───
    const E_INSUFFICIENT_FUNDS: u64 = 0;
    const E_MAX_LEVEL: u64 = 2;
    const E_UNAUTHORIZED: u64 = 6;
    const E_LOBBY_NOT_FULL: u64 = 7;
    const E_LOBBY_FULL: u64 = 8;
    const E_INVALID_HASH: u64 = 9;
    const E_TIMEOUT_NOT_REACHED: u64 = 10;
    const E_COOLDOWN: u64 = 12;
    const E_INVALID_WAGER: u64 = 13;
    const E_INVALID_ELEMENT: u64 = 14;
    const E_SLUG_SLEEPING: u64 = 15;
    const E_ALREADY_REVEALED: u64 = 16;
    const E_NOT_BOTH_REVEALED: u64 = 17;

    // ─── Game Constants ───
    const MAX_LEVEL: u64 = 50;
    const PREMIUM_MINT_PRICE: u64 = 500_000_000; // 0.5 SUI
    const SPIN_PRICE: u64 = 50_000_000; // 0.05 SUI
    const SPIN_COOLDOWN_MS: u64 = 86_400_000; // 24 hours
    const PVP_TIMEOUT_MS: u64 = 180_000; // 3 minutes

    // ─── Structs ───

    public struct Slug has key, store {
        id: UID,
        name: String,
        element: u8,
        hp: u64,
        attack: u64,
        win_count: u64,
        loss_count: u64,
        level: u64,
        sleep_until_ms: u64,
        consecutive_losses: u64,
    }

    public struct MarketplaceConfig has key {
        id: UID,
        vault: Balance<SUI>,
    }

    public struct SpinRegistry has key {
        id: UID,
        last_spins: Table<address, u64>,
    }

    public struct PvpLobby has key {
        id: UID,
        player1: address,
        slug1_hash: vector<u8>,
        slug1_revealed: bool,
        slug1_id: ID,
        slug1_hp: u64,
        slug1_attack: u64,
        slug1_element: u8,
        slug1_level: u64,
        player2: address,
        slug2_hash: vector<u8>,
        slug2_revealed: bool,
        slug2_id: ID,
        slug2_hp: u64,
        slug2_attack: u64,
        slug2_element: u8,
        slug2_level: u64,
        wager_amount: u64,
        pool: Balance<SUI>,
        join_time_ms: u64,
    }

    public struct AdminCap has key, store {
        id: UID,
    }

    // ─── Events ───

    public struct BattleResolved has copy, drop {
        lobby_id: ID,
        winner: address,       // @0x0 means draw
        payout: u64,
        slug1_id: ID,
        slug2_id: ID,
        is_draw: bool,
    }

    public struct SpinRewardEvent has copy, drop {
        player: address,
        reward_type: u8, // 1=Water slug, 2=Air slug, 3=Fire slug, 4=Earth slug, 5=Coins
        amount: u64,
        slug_id: ID,
    }

    // ─── Helper: get base stats for an element ───
    fun get_base_stats(element: u8): (u64, u64) {
        if (element == ELEMENT_FIRE) { (FIRE_HP, FIRE_ATK) }
        else if (element == ELEMENT_WATER) { (WATER_HP, WATER_ATK) }
        else if (element == ELEMENT_EARTH) { (EARTH_HP, EARTH_ATK) }
        else { (AIR_HP, AIR_ATK) } // ELEMENT_AIR
    }

    // ─── Helper: get stats at a given level (element-specific % growth) ───
    fun get_leveled_stats(element: u8, level: u64): (u64, u64) {
        let (base_hp, base_atk) = get_base_stats(element);
        let levels_gained = level - 1;
        
        // Growth per level (in tenths of percent to avoid floats):
        // Fire:  HP +1%, ATK +4%  → hp_growth=10, atk_growth=40
        // Water: HP +3%, ATK +2%  → hp_growth=30, atk_growth=20
        // Earth: HP +4%, ATK +1%  → hp_growth=40, atk_growth=10
        // Air:   HP +2%, ATK +3%  → hp_growth=20, atk_growth=30
        let (hp_growth, atk_growth) = if (element == ELEMENT_FIRE) { (10u64, 40u64) }
            else if (element == ELEMENT_WATER) { (30u64, 20u64) }
            else if (element == ELEMENT_EARTH) { (40u64, 10u64) }
            else { (20u64, 30u64) };

        let final_hp = base_hp + (base_hp * hp_growth * levels_gained / 1000);
        let final_atk = base_atk + (base_atk * atk_growth * levels_gained / 1000);
        
        (final_hp, final_atk)
    }

    // ─── Helper: auto-name based on element ───
    fun default_name(element: u8): String {
        if (element == ELEMENT_FIRE) { string::utf8(b"INFERNO") }
        else if (element == ELEMENT_WATER) { string::utf8(b"TIDAL") }
        else if (element == ELEMENT_EARTH) { string::utf8(b"BOULDER") }
        else { string::utf8(b"ZEPHYR") }
    }

    // ─── Init ───

    fun init(ctx: &mut TxContext) {
        let config = MarketplaceConfig {
            id: object::new(ctx),
            vault: balance::zero(),
        };
        transfer::share_object(config);

        let registry = SpinRegistry {
            id: object::new(ctx),
            last_spins: table::new(ctx),
        };
        transfer::share_object(registry);

        let admin = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(admin, ctx.sender());
    }

    // ─── Minting ───

    public entry fun free_mint(
        name: String,
        r: &Random,
        ctx: &mut TxContext
    ) {
        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u32_in_range(&mut generator, 0, 99);

        // Free: Water 5%, Air 15%, Fire 40%, Earth 40%
        let element: u8 = if (roll < 5) { ELEMENT_WATER }
            else if (roll < 20) { ELEMENT_AIR }
            else if (roll < 60) { ELEMENT_FIRE }
            else { ELEMENT_EARTH };

        let (base_hp, base_atk) = get_base_stats(element);
        let final_name = if (string::length(&name) == 0) { default_name(element) } else { name };

        let slug = Slug {
            id: object::new(ctx),
            name: final_name,
            element,
            hp: base_hp,
            attack: base_atk,
            win_count: 0,
            loss_count: 0,
            level: 1,
            sleep_until_ms: 0,
            consecutive_losses: 0,
        };
        transfer::public_transfer(slug, ctx.sender());
    }

    public entry fun premium_mint(
        config: &mut MarketplaceConfig,
        name: String,
        r: &Random,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(payment.value() >= PREMIUM_MINT_PRICE, E_INSUFFICIENT_FUNDS);

        let paid_coin = payment.split(PREMIUM_MINT_PRICE, ctx);
        config.vault.join(paid_coin.into_balance());
        if (payment.value() > 0) { transfer::public_transfer(payment, ctx.sender()); }
        else { payment.destroy_zero(); };

        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u32_in_range(&mut generator, 0, 99);

        // Premium: Water 10%, Air 30%, Fire 30%, Earth 30%
        let element: u8 = if (roll < 10) { ELEMENT_WATER }
            else if (roll < 40) { ELEMENT_AIR }
            else if (roll < 70) { ELEMENT_FIRE }
            else { ELEMENT_EARTH };

        let (base_hp, base_atk) = get_base_stats(element);
        let final_name = if (string::length(&name) == 0) { default_name(element) } else { name };

        let slug = Slug {
            id: object::new(ctx),
            name: final_name,
            element,
            hp: base_hp,
            attack: base_atk,
            win_count: 0,
            loss_count: 0,
            level: 1,
            sleep_until_ms: 0,
            consecutive_losses: 0,
        };
        transfer::public_transfer(slug, ctx.sender());
    }

    // ─── Level Up ───
    // Cost = level * 10 dark coins (checked client-side, no on-chain coin cost)
    // Stats grow by element-specific percentages

    public entry fun level_up(slug: &mut Slug, _ctx: &mut TxContext) {
        assert!(slug.level < MAX_LEVEL, E_MAX_LEVEL);
        slug.level = slug.level + 1;
        let (new_hp, new_atk) = get_leveled_stats(slug.element, slug.level);
        slug.hp = new_hp;
        slug.attack = new_atk;
    }

    // ─── Quantum Spin ───

    public entry fun quantum_spin(
        config: &mut MarketplaceConfig,
        registry: &mut SpinRegistry,
        clock: &Clock,
        r: &Random,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(payment.value() >= SPIN_PRICE, E_INSUFFICIENT_FUNDS);

        let current_time = sui::clock::timestamp_ms(clock);
        if (table::contains(&registry.last_spins, ctx.sender())) {
            let last_time = *table::borrow(&registry.last_spins, ctx.sender());
            assert!(current_time > last_time + SPIN_COOLDOWN_MS, E_COOLDOWN);
            *table::borrow_mut(&mut registry.last_spins, ctx.sender()) = current_time;
        } else {
            table::add(&mut registry.last_spins, ctx.sender(), current_time);
        };

        let paid_coin = payment.split(SPIN_PRICE, ctx);
        config.vault.join(paid_coin.into_balance());
        if (payment.value() > 0) { transfer::public_transfer(payment, ctx.sender()); }
        else { payment.destroy_zero(); };

        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u32_in_range(&mut generator, 0, 99);

        if (roll < 5) {
            // 5% — Water slug
            let (hp, atk) = get_base_stats(ELEMENT_WATER);
            let slug = Slug {
                id: object::new(ctx),
                name: string::utf8(b"QUANTUM TIDAL"),
                element: ELEMENT_WATER, hp, attack: atk,
                win_count: 0, loss_count: 0, level: 1,
                sleep_until_ms: 0, consecutive_losses: 0,
            };
            let slug_id = object::id(&slug);
            transfer::public_transfer(slug, ctx.sender());
            event::emit(SpinRewardEvent { player: ctx.sender(), reward_type: 1, amount: 0, slug_id });
        } else if (roll < 15) {
            // 10% — Air slug
            let (hp, atk) = get_base_stats(ELEMENT_AIR);
            let slug = Slug {
                id: object::new(ctx),
                name: string::utf8(b"QUANTUM ZEPHYR"),
                element: ELEMENT_AIR, hp, attack: atk,
                win_count: 0, loss_count: 0, level: 1,
                sleep_until_ms: 0, consecutive_losses: 0,
            };
            let slug_id = object::id(&slug);
            transfer::public_transfer(slug, ctx.sender());
            event::emit(SpinRewardEvent { player: ctx.sender(), reward_type: 2, amount: 0, slug_id });
        } else if (roll < 30) {
            // 15% — Fire or Earth slug (random)
            let sub = random::generate_u8_in_range(&mut generator, 0, 1);
            let element = if (sub == 0) { ELEMENT_FIRE } else { ELEMENT_EARTH };
            let (hp, atk) = get_base_stats(element);
            let n = if (element == ELEMENT_FIRE) { string::utf8(b"QUANTUM INFERNO") } 
                    else { string::utf8(b"QUANTUM BOULDER") };
            let slug = Slug {
                id: object::new(ctx),
                name: n, element, hp, attack: atk,
                win_count: 0, loss_count: 0, level: 1,
                sleep_until_ms: 0, consecutive_losses: 0,
            };
            let slug_id = object::id(&slug);
            transfer::public_transfer(slug, ctx.sender());
            let rt: u8 = if (element == ELEMENT_FIRE) { 3 } else { 4 };
            event::emit(SpinRewardEvent { player: ctx.sender(), reward_type: rt, amount: 0, slug_id });
        } else {
            // 70% — Dark Coins (50-300)
            let amount = random::generate_u64_in_range(&mut generator, 50, 300);
            event::emit(SpinRewardEvent { 
                player: ctx.sender(), 
                reward_type: 5, 
                amount, 
                slug_id: object::id_from_address(@0x0) 
            });
        };
    }

    // ─── PvP: Double-Blind Commit-Reveal ───

    public entry fun create_pvp_lobby(
        slug1_hash: vector<u8>,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let wager_amount = payment.value();
        assert!(
            wager_amount == 1_000_000_000 || 
            wager_amount == 5_000_000_000 || 
            wager_amount == 10_000_000_000, 
            E_INVALID_WAGER
        );

        let lobby = PvpLobby {
            id: object::new(ctx),
            player1: ctx.sender(),
            slug1_hash,
            slug1_revealed: false,
            slug1_id: object::id_from_address(@0x0),
            slug1_hp: 0,
            slug1_attack: 0,
            slug1_element: 0,
            slug1_level: 0,
            player2: @0x0,
            slug2_hash: vector::empty(),
            slug2_revealed: false,
            slug2_id: object::id_from_address(@0x0),
            slug2_hp: 0,
            slug2_attack: 0,
            slug2_element: 0,
            slug2_level: 0,
            wager_amount,
            pool: payment.into_balance(),
            join_time_ms: 0,
        };
        transfer::share_object(lobby);
    }

    public entry fun join_pvp_lobby(
        lobby: &mut PvpLobby,
        slug2_hash: vector<u8>,
        clock: &Clock,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(lobby.player2 == @0x0, E_LOBBY_FULL);
        // SECURITY: Prevent self-join
        assert!(ctx.sender() != lobby.player1, E_UNAUTHORIZED);
        let wager_amount = lobby.wager_amount;
        assert!(payment.value() >= wager_amount, E_INSUFFICIENT_FUNDS);

        let paid_coin = payment.split(wager_amount, ctx);
        lobby.pool.join(paid_coin.into_balance());
        if (payment.value() > 0) { transfer::public_transfer(payment, ctx.sender()); }
        else { payment.destroy_zero(); };

        lobby.player2 = ctx.sender();
        lobby.slug2_hash = slug2_hash;
        lobby.join_time_ms = sui::clock::timestamp_ms(clock);
    }

    public entry fun cancel_pvp_lobby(lobby: PvpLobby, ctx: &mut TxContext) {
        assert!(ctx.sender() == lobby.player1, E_UNAUTHORIZED);
        assert!(lobby.player2 == @0x0, E_LOBBY_FULL);

        let PvpLobby { 
            id, player1: _, slug1_hash: _, slug1_revealed: _, slug1_id: _,
            slug1_hp: _, slug1_attack: _, slug1_element: _, slug1_level: _,
            player2: _, slug2_hash: _, slug2_revealed: _, slug2_id: _,
            slug2_hp: _, slug2_attack: _, slug2_element: _, slug2_level: _,
            wager_amount: _, pool, join_time_ms: _
        } = lobby;

        let payout = pool.into_coin(ctx);
        transfer::public_transfer(payout, ctx.sender());
        object::delete(id);
    }

    // Player 1 reveals their slug
    public entry fun reveal_slug_p1(
        lobby: &mut PvpLobby,
        slug: &Slug,
        salt: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // SECURITY: Only player1 can reveal their slug
        assert!(ctx.sender() == lobby.player1, E_UNAUTHORIZED);
        assert!(!lobby.slug1_revealed, E_ALREADY_REVEALED);
        assert!(lobby.player2 != @0x0, E_LOBBY_NOT_FULL);
        // SECURITY: Validate salt length
        assert!(vector::length(&salt) <= 64, E_INVALID_HASH);
        // SECURITY: Enforce sleep penalty — sleeping slugs can't enter PvP
        assert!(slug.sleep_until_ms <= sui::clock::timestamp_ms(clock), E_SLUG_SLEEPING);

        // Verify commit-reveal hash
        let slug_id_bytes = object::id_to_bytes(&object::id(slug));
        let mut payload = slug_id_bytes;
        vector::append(&mut payload, salt);
        let computed_hash = blake2b256(&payload);
        assert!(computed_hash == lobby.slug1_hash, E_INVALID_HASH);

        // Validate element
        assert!(
            slug.element >= ELEMENT_FIRE && slug.element <= ELEMENT_AIR, 
            E_INVALID_ELEMENT
        );

        // Store revealed stats (leveled)
        let (leveled_hp, leveled_atk) = get_leveled_stats(slug.element, slug.level);
        lobby.slug1_revealed = true;
        lobby.slug1_id = object::id(slug);
        lobby.slug1_hp = leveled_hp;
        lobby.slug1_attack = leveled_atk;
        lobby.slug1_element = slug.element;
        lobby.slug1_level = slug.level;
    }

    // Player 2 reveals their slug
    public entry fun reveal_slug_p2(
        lobby: &mut PvpLobby,
        slug: &Slug,
        salt: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // SECURITY: Only player2 can reveal their slug
        assert!(ctx.sender() == lobby.player2, E_UNAUTHORIZED);
        assert!(!lobby.slug2_revealed, E_ALREADY_REVEALED);
        assert!(lobby.player2 != @0x0, E_LOBBY_NOT_FULL);
        // SECURITY: Validate salt length
        assert!(vector::length(&salt) <= 64, E_INVALID_HASH);
        // SECURITY: Enforce sleep penalty
        assert!(slug.sleep_until_ms <= sui::clock::timestamp_ms(clock), E_SLUG_SLEEPING);

        // Verify commit-reveal hash
        let slug_id_bytes = object::id_to_bytes(&object::id(slug));
        let mut payload = slug_id_bytes;
        vector::append(&mut payload, salt);
        let computed_hash = blake2b256(&payload);
        assert!(computed_hash == lobby.slug2_hash, E_INVALID_HASH);

        // Validate element
        assert!(
            slug.element >= ELEMENT_FIRE && slug.element <= ELEMENT_AIR, 
            E_INVALID_ELEMENT
        );

        // Store revealed stats (leveled)
        let (leveled_hp, leveled_atk) = get_leveled_stats(slug.element, slug.level);
        lobby.slug2_revealed = true;
        lobby.slug2_id = object::id(slug);
        lobby.slug2_hp = leveled_hp;
        lobby.slug2_attack = leveled_atk;
        lobby.slug2_element = slug.element;
        lobby.slug2_level = slug.level;
    }

    // Resolve battle — anyone can call once both have revealed
    public entry fun resolve_pvp(
        lobby: PvpLobby,
        slug1: &mut Slug,
        slug2: &mut Slug,
        r: &Random,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(lobby.slug1_revealed && lobby.slug2_revealed, E_NOT_BOTH_REVEALED);
        // SECURITY: Only players can resolve their own match
        assert!(ctx.sender() == lobby.player1 || ctx.sender() == lobby.player2, E_UNAUTHORIZED);
        // SECURITY: Verify correct slugs are passed (prevent stat-manipulation via wrong slugs)
        assert!(object::id(slug1) == lobby.slug1_id, E_UNAUTHORIZED);
        assert!(object::id(slug2) == lobby.slug2_id, E_UNAUTHORIZED);

        let mut generator = random::new_generator(r, ctx);

        // Get leveled stats
        let mut hp1 = lobby.slug1_hp;
        let mut hp2 = lobby.slug2_hp;
        let base_atk1 = lobby.slug1_attack;
        let base_atk2 = lobby.slug2_attack;
        let el1 = lobby.slug1_element;
        let el2 = lobby.slug2_element;

        // Elemental advantage: +15% damage
        let mut atk1_mult: u64 = 100;
        let mut atk2_mult: u64 = 100;

        // P1 advantage check
        if ((el1 == ELEMENT_WATER && el2 == ELEMENT_FIRE) ||
            (el1 == ELEMENT_FIRE && el2 == ELEMENT_EARTH) ||
            (el1 == ELEMENT_EARTH && el2 == ELEMENT_AIR) ||
            (el1 == ELEMENT_AIR && el2 == ELEMENT_WATER)) {
            atk1_mult = 115; // +15% damage
        };

        // P2 advantage check
        if ((el2 == ELEMENT_WATER && el1 == ELEMENT_FIRE) ||
            (el2 == ELEMENT_FIRE && el1 == ELEMENT_EARTH) ||
            (el2 == ELEMENT_EARTH && el1 == ELEMENT_AIR) ||
            (el2 == ELEMENT_AIR && el1 == ELEMENT_WATER)) {
            atk2_mult = 115; // +15% damage
        };

        // Simulate rounds (max 100 to prevent infinite loops)
        let mut round = 0;
        while (round < 100 && hp1 > 0 && hp2 > 0) {
            // Random variance [95, 105] for each attacker each round
            let v1 = random::generate_u64_in_range(&mut generator, 95, 105);
            let v2 = random::generate_u64_in_range(&mut generator, 95, 105);

            let dmg1 = base_atk1 * atk1_mult * v1 / 10000; // damage P1 deals to P2
            let dmg2 = base_atk2 * atk2_mult * v2 / 10000; // damage P2 deals to P1

            // Apply damage simultaneously
            if (dmg2 >= hp1) { hp1 = 0; } else { hp1 = hp1 - dmg2; };
            if (dmg1 >= hp2) { hp2 = 0; } else { hp2 = hp2 - dmg1; };

            round = round + 1;
        };

        // Determine winner
        let is_draw = (hp1 == 0 && hp2 == 0) || (hp1 > 0 && hp2 > 0); // both alive at 100 rounds = draw too
        let current_time = sui::clock::timestamp_ms(clock);

        let PvpLobby {
            id, player1, slug1_hash: _, slug1_revealed: _, slug1_id: s1_id,
            slug1_hp: _, slug1_attack: _, slug1_element: _, slug1_level: _,
            player2, slug2_hash: _, slug2_revealed: _, slug2_id: s2_id,
            slug2_hp: _, slug2_attack: _, slug2_element: _, slug2_level: _,
            wager_amount: _, pool, join_time_ms: _
        } = lobby;

        let pool_value = balance::value(&pool);
        let lobby_id = object::uid_to_inner(&id);

        if (is_draw) {
            // Draw — split pool equally, return to each player
            let half = pool_value / 2;
            let mut pool_mut = pool;
            let p1_coin = balance::split(&mut pool_mut, half).into_coin(ctx);
            let p2_coin = pool_mut.into_coin(ctx);
            transfer::public_transfer(p1_coin, player1);
            transfer::public_transfer(p2_coin, player2);

            event::emit(BattleResolved {
                lobby_id, winner: @0x0, payout: 0,
                slug1_id: s1_id, slug2_id: s2_id, is_draw: true,
            });
        } else if (hp1 > 0) {
            // Player 1 wins
            slug1.win_count = slug1.win_count + 1;
            slug2.loss_count = slug2.loss_count + 1;
            slug2.consecutive_losses = slug2.consecutive_losses + 1;
            slug1.consecutive_losses = 0;

            // Sleep penalty for loser
            let sleep_ms: u64 = if (slug2.consecutive_losses == 1) { 300_000 }      // 5 min
                else if (slug2.consecutive_losses == 2) { 900_000 }   // 15 min
                else { 1_800_000 };                                    // 30 min
            slug2.sleep_until_ms = current_time + sleep_ms;

            let payout = pool.into_coin(ctx);
            transfer::public_transfer(payout, player1);

            event::emit(BattleResolved {
                lobby_id, winner: player1, payout: pool_value,
                slug1_id: s1_id, slug2_id: s2_id, is_draw: false,
            });
        } else {
            // Player 2 wins
            slug2.win_count = slug2.win_count + 1;
            slug1.loss_count = slug1.loss_count + 1;
            slug1.consecutive_losses = slug1.consecutive_losses + 1;
            slug2.consecutive_losses = 0;

            // Sleep penalty for loser
            let sleep_ms: u64 = if (slug1.consecutive_losses == 1) { 300_000 }
                else if (slug1.consecutive_losses == 2) { 900_000 }
                else { 1_800_000 };
            slug1.sleep_until_ms = current_time + sleep_ms;

            let payout = pool.into_coin(ctx);
            transfer::public_transfer(payout, player2);

            event::emit(BattleResolved {
                lobby_id, winner: player2, payout: pool_value,
                slug1_id: s1_id, slug2_id: s2_id, is_draw: false,
            });
        };

        object::delete(id);
    }

    // Claim timeout — if opponent hasn't revealed within 3 minutes
    public entry fun claim_timeout(
        lobby: PvpLobby,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(lobby.player2 != @0x0, E_LOBBY_NOT_FULL);
        let current_time = sui::clock::timestamp_ms(clock);
        assert!(current_time > lobby.join_time_ms + PVP_TIMEOUT_MS, E_TIMEOUT_NOT_REACHED);

        // SECURITY: Only players in this lobby can claim timeout
        let caller = ctx.sender();
        assert!(caller == lobby.player1 || caller == lobby.player2, E_UNAUTHORIZED);
        let caller_revealed = if (caller == lobby.player1) { lobby.slug1_revealed }
            else { lobby.slug2_revealed };
        let opponent_revealed = if (caller == lobby.player1) { lobby.slug2_revealed }
            else { lobby.slug1_revealed };

        // Caller must have revealed AND opponent must NOT have revealed
        assert!(caller_revealed, E_UNAUTHORIZED);
        assert!(!opponent_revealed, E_TIMEOUT_NOT_REACHED);

        let PvpLobby {
            id, player1: _, slug1_hash: _, slug1_revealed: _, slug1_id: s1_id,
            slug1_hp: _, slug1_attack: _, slug1_element: _, slug1_level: _,
            player2: _, slug2_hash: _, slug2_revealed: _, slug2_id: s2_id,
            slug2_hp: _, slug2_attack: _, slug2_element: _, slug2_level: _,
            wager_amount: _, pool, join_time_ms: _
        } = lobby;

        let pool_value = balance::value(&pool);
        let payout = pool.into_coin(ctx);
        transfer::public_transfer(payout, caller);

        event::emit(BattleResolved {
            lobby_id: object::uid_to_inner(&id),
            winner: caller,
            payout: pool_value,
            slug1_id: s1_id,
            slug2_id: s2_id,
            is_draw: false,
        });

        object::delete(id);
    }

    // ─── Ascend (burn/delete slug) ───

    public entry fun ascend(slug: Slug, _ctx: &mut TxContext) {
        let Slug {
            id, name: _, element: _, hp: _, attack: _,
            win_count: _, loss_count: _, level: _,
            sleep_until_ms: _, consecutive_losses: _,
        } = slug;
        object::delete(id);
    }

    // ─── Admin ───

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

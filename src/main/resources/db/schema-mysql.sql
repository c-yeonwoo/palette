
    create table card_opens (
        opened_at datetime(6) not null,
        id BINARY(16) not null,
        target_user_id BINARY(16) not null,
        viewer_id BINARY(16) not null,
        primary key (id)
    ) engine=InnoDB;

    create table device_tokens (
        created_at datetime(6) not null,
        updated_at datetime(6) not null,
        id binary(16) not null,
        token varchar(512) not null,
        user_id varchar(255) not null,
        platform enum ('ANDROID','IOS','WEB') not null,
        primary key (id)
    ) engine=InnoDB;

    create table feed_hides (
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        target_user_id varchar(255) not null,
        user_id varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table friendships (
        accepted_at datetime(6),
        created_at datetime(6) not null,
        id binary(16) not null,
        user1_id binary(16) not null,
        user2_id binary(16) not null,
        status enum ('ACCEPTED','PENDING') not null,
        primary key (id)
    ) engine=InnoDB;

    create table invite_codes (
        created_at datetime(6) not null,
        expires_at datetime(6) not null,
        code varchar(10) not null,
        id BINARY(16) not null,
        user_id BINARY(16) not null,
        primary key (id)
    ) engine=InnoDB;

    create table matchmaker_reviews (
        rating integer not null,
        created_at datetime(6) not null,
        id BINARY(16) not null,
        matchmaker_id BINARY(16) not null,
        reviewer_user_id BINARY(16) not null,
        comment TEXT,
        primary key (id)
    ) engine=InnoDB;

    create table matchmakers (
        approved_requests integer not null,
        average_rating float(53) not null,
        commission_rate float(53) not null,
        failed_matches integer not null,
        is_public_profile bit not null,
        level integer not null,
        pending_points integer not null,
        rejected_requests integer not null,
        successful_matches integer not null,
        total_match_requests integer not null,
        total_points integer not null,
        total_reviews integer not null,
        withdrawn_points integer not null,
        created_at datetime(6) not null,
        profile_photo_uploaded_at datetime(6),
        updated_at datetime(6) not null,
        id BINARY(16) not null,
        user_id BINARY(16) not null,
        bio TEXT,
        profile_photo_url TEXT,
        specialties TEXT,
        primary key (id)
    ) engine=InnoDB;

    create table matchmaking_requests (
        matchmaker_approved bit,
        target_accepted bit,
        created_at datetime(6) not null,
        matchmaker_decided_at datetime(6),
        target_decided_at datetime(6),
        updated_at datetime(6) not null,
        id BINARY(16) not null,
        matchmaker_id BINARY(16) not null,
        requester_id BINARY(16) not null,
        target_user_id BINARY(16) not null,
        status varchar(30) not null,
        matchmaker_message TEXT,
        requester_message TEXT,
        target_message TEXT,
        primary key (id)
    ) engine=InnoDB;

    create table notifications (
        is_read bit not null,
        created_at datetime(6) not null,
        id binary(16) not null,
        body varchar(500) not null,
        metadata_json TEXT not null,
        title varchar(255) not null,
        user_id varchar(255) not null,
        type enum ('FRIEND_ACCEPTED','FRIEND_REQUEST','MATCH_APPROVED','MATCH_COMPLETED','MATCH_REJECTED','MATCH_REJECTED_BY_TARGET','MATCH_REQUEST','PROFILE_VIEW','SYSTEM') not null,
        primary key (id)
    ) engine=InnoDB;

    create table paid_views (
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        buyer_user_id varchar(255) not null,
        target_user_id varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table payment_transactions (
        amount integer not null,
        created_at datetime(6) not null,
        buyer_user_id varchar(255) not null,
        id varchar(255) not null,
        payment_method varchar(255) not null,
        target_user_id varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table photo_feedbacks (
        created_at datetime(6) not null,
        id binary(16) not null,
        request_id binary(16) not null,
        similarity varchar(255) not null,
        user_id varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table profile_photos (
        ai_has_clear_face bit,
        ai_has_face bit,
        ai_has_full_body bit,
        ai_is_over_processed bit,
        ai_is_selfie bit,
        ai_is_taken_by_others bit,
        ai_quality_score integer,
        display_order integer not null,
        is_primary bit not null,
        trust_score integer not null,
        created_at datetime(6) not null,
        id BINARY(16) not null,
        profile_id BINARY(16) not null,
        s3_key varchar(500) not null,
        url varchar(1000) not null,
        ai_raw_data TEXT,
        trust_factor enum ('SELFIE','TAKEN_BY_OTHERS','UNCLEAR','UNKNOWN') not null,
        primary key (id)
    ) engine=InnoDB;

    create table profile_videos (
        duration_seconds integer not null,
        created_at datetime(6) not null,
        id BINARY(16) not null,
        profile_id BINARY(16) not null,
        s3_key varchar(500) not null,
        thumbnail_url varchar(1000) not null,
        url varchar(1000) not null,
        primary key (id)
    ) engine=InnoDB;

    create table profiles (
        attachment_conflict_style integer,
        attachment_contact_anxiety integer,
        attachment_emotion_expression integer,
        attachment_independence_level integer,
        attachment_intimacy_avoidance integer,
        completion_rate integer not null,
        height integer,
        is_accepting_matches bit not null,
        trust_score integer not null,
        view_count integer not null,
        created_at datetime(6) not null,
        deleted_at datetime(6),
        hidden_at datetime(6),
        last_accessed_at datetime(6) not null,
        updated_at datetime(6) not null,
        id BINARY(16) not null,
        user_id BINARY(16) not null,
        color_type varchar(30),
        work_sido varchar(50),
        work_sigungu varchar(50),
        sido varchar(50),
        sigungu varchar(50),
        company varchar(100),
        major varchar(100),
        school varchar(100),
        bucket_list TEXT,
        ideal_appearance_styles TEXT,
        ideal_date_preferences TEXT,
        ideal_deal_breakers TEXT,
        ideal_important_values TEXT,
        ideal_personalities TEXT,
        interests TEXT,
        introduction_charm TEXT,
        introduction_happiness TEXT,
        introduction_hobby TEXT,
        introduction_motto TEXT,
        introduction_passion TEXT,
        introduction_text TEXT,
        personality_tests TEXT,
        taste_stack TEXT,
        body_type enum ('ATHLETIC','AVERAGE','CURVY','MUSCULAR','SLIM'),
        career_category enum ('EDUCATION','FINANCE','IT_DEVELOPMENT','MANUFACTURING','MEDIA','MEDICAL','OTHER','PROFESSIONAL','PUBLIC_OFFICIAL','SERVICE'),
        drinking enum ('NEVER','OFTEN','SOMETIMES'),
        education_level enum ('ASSOCIATE','BACHELOR','DOCTORATE','HIGH_SCHOOL','MASTER'),
        income_range enum ('INCOME_RANGE_1','INCOME_RANGE_2','INCOME_RANGE_3','INCOME_RANGE_4','INCOME_RANGE_5'),
        mbti enum ('ENFJ','ENFP','ENTJ','ENTP','ESFJ','ESFP','ESTJ','ESTP','INFJ','INFP','INTJ','INTP','ISFJ','ISFP','ISTJ','ISTP'),
        religion enum ('BUDDHISM','CATHOLICISM','CHRISTIANITY','NONE','OTHER'),
        smoking enum ('NEVER','OFTEN','SOMETIMES'),
        primary key (id)
    ) engine=InnoDB;

    create table relationship_stages (
        updated_at datetime(6) not null,
        id binary(16) not null,
        request_id binary(16) not null,
        message varchar(500),
        stage varchar(255) not null,
        user_id varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table share_links (
        view_count integer not null,
        created_at datetime(6) not null,
        expires_at datetime(6),
        updated_at datetime(6) not null,
        user_id binary(16) not null,
        code varchar(255) not null,
        primary key (code)
    ) engine=InnoDB;

    create table user_ai_insights (
        updated_at datetime(6) not null,
        user_id BINARY(16) not null,
        attachment_style varchar(30),
        love_language varchar(40),
        primary key (user_id)
    ) engine=InnoDB;

    create table users (
        agreed_marketing bit not null,
        agreed_terms_privacy bit not null,
        agreed_terms_service bit not null,
        birth_date date not null,
        is_phone_verified bit not null,
        is_profile_completed bit not null,
        agreed_at datetime(6) not null,
        created_at datetime(6) not null,
        deleted_at datetime(6),
        last_login_at datetime(6) not null,
        updated_at datetime(6) not null,
        id BINARY(16) not null,
        nickname varchar(20) not null,
        phone_number varchar(20),
        real_name varchar(50) not null,
        kakao_talk_id varchar(100),
        email varchar(255),
        oauth_id varchar(255),
        password varchar(255),
        account_type enum ('MATCHMAKER_ONLY','REGULAR') not null,
        gender enum ('FEMALE','MALE') not null,
        oauth_provider enum ('APPLE','GOOGLE','KAKAO','NAVER'),
        preferred_contact_method enum ('KAKAOTALK','PHONE'),
        role enum ('USER','ADMIN') not null default 'USER',
        status enum ('ACTIVE','PENDING_APPROVAL','REJECTED','SUSPENDED','DORMANT') not null default 'ACTIVE',
        status_reason varchar(500),
        status_updated_at datetime(6),
        status_updated_by BINARY(16),
        primary key (id)
    ) engine=InnoDB;

    create table vouches (
        created_at datetime(6) not null,
        id binary(16) not null,
        target_user_id varchar(255) not null,
        voucher_id varchar(255) not null,
        preset_key varchar(32),
        message varchar(50),
        primary key (id)
    ) engine=InnoDB;

    alter table card_opens 
       add constraint UKigluvklp923kx7l2nbrikbql4 unique (viewer_id, target_user_id);

    create index idx_device_token_user_id 
       on device_tokens (user_id);

    alter table device_tokens 
       add constraint UK8se1i37nto56x9252rmrit8ib unique (token);

    alter table feed_hides 
       add constraint UKhrsi6oqv54pr8krt42yhpnthu unique (user_id, target_user_id);

    create index idx_friendship_user1 
       on friendships (user1_id);

    create index idx_friendship_user2 
       on friendships (user2_id);

    create index idx_friendship_status 
       on friendships (status);

    alter table friendships 
       add constraint uk_friendship_users unique (user1_id, user2_id);

    create index idx_invite_codes_user_id 
       on invite_codes (user_id);

    alter table invite_codes 
       add constraint idx_invite_codes_code unique (code);

    create index idx_mr_requester_id 
       on matchmaking_requests (requester_id);

    create index idx_mr_target_user_id 
       on matchmaking_requests (target_user_id);

    create index idx_mr_matchmaker_id 
       on matchmaking_requests (matchmaker_id);

    create index idx_mr_requester_status 
       on matchmaking_requests (requester_id, status);

    create index idx_mr_requester_status_updated 
       on matchmaking_requests (requester_id, status, updated_at);

    create index idx_notification_user_id 
       on notifications (user_id);

    create index idx_notification_is_read 
       on notifications (is_read);

    alter table paid_views 
       add constraint UK2kqh54xfx12f5476nrhd0qiv6 unique (buyer_user_id, target_user_id);

    create index idx_photo_feedback_request_id 
       on photo_feedbacks (request_id);

    alter table photo_feedbacks 
       add constraint UK9yg3t0hlw49wdg8p2f8t2ya6v unique (request_id, user_id);

    alter table profiles 
       add constraint idx_profiles_user_id unique (user_id);

    create index idx_rel_stage_request_id 
       on relationship_stages (request_id);

    alter table relationship_stages 
       add constraint UK7o7ugke04o3xt2of0asl25vi5 unique (request_id);

    alter table share_links 
       add constraint idx_share_link_user_id unique (user_id);

    create index idx_users_email 
       on users (email);

    create index idx_users_phone 
       on users (phone_number);

    alter table users 
       add constraint idx_users_oauth unique (oauth_provider, oauth_id);

    alter table users 
       add constraint UK2ty1xmrrgtn89xt7kyxx6ta7h unique (nickname);

    create index idx_vouch_target_user_id 
       on vouches (target_user_id);

    alter table vouches 
       add constraint UKb2vn2b5n1icx4apr7fork1a4c unique (target_user_id, voucher_id);

    create table daily_recommendations (
        id bigint not null auto_increment,
        viewer_user_id BINARY(16) not null,
        target_user_id BINARY(16) not null,
        recommended_date date not null,
        position int not null,
        source varchar(16) not null default 'AUTO',
        created_at datetime(6) not null,
        primary key (id)
    ) engine=InnoDB;

    alter table daily_recommendations
       add constraint uk_drec_viewer_date_position unique (viewer_user_id, recommended_date, position);

    create index idx_drec_viewer_date
       on daily_recommendations (viewer_user_id, recommended_date);

    create index idx_drec_viewer_target
       on daily_recommendations (viewer_user_id, target_user_id);

    create index idx_drec_date
       on daily_recommendations (recommended_date);

    alter table daily_recommendations
        add column override_reason varchar(500),
        add column overridden_by BINARY(16),
        add column overridden_at datetime(6);

    create table admin_blocked_targets (
        id bigint not null auto_increment,
        viewer_user_id BINARY(16) not null,
        target_user_id BINARY(16) not null,
        reason varchar(500) not null,
        created_by BINARY(16) not null,
        created_at datetime(6) not null,
        expires_at date,
        primary key (id)
    ) engine=InnoDB;

    alter table admin_blocked_targets
        add constraint uk_abt_viewer_target unique (viewer_user_id, target_user_id);

    create index idx_abt_viewer
        on admin_blocked_targets (viewer_user_id);

    alter table matchmaking_requests
        add column admin_note text,
        add column admin_last_updated_at datetime(6),
        add column admin_last_updated_by BINARY(16);

    create table palette_pick_batch_runs (
        id BINARY(16) not null,
        run_date varchar(10) not null,
        trigger_type varchar(16) not null,
        status varchar(16) not null,
        started_at datetime(6) not null,
        finished_at datetime(6),
        active_users integer not null,
        viewers_processed integer not null,
        llm_calls integer not null,
        failures integer not null,
        hit_call_cap bit not null,
        error_sample varchar(500),
        primary key (id)
    ) engine=InnoDB;

    create index idx_ppbatch_started
        on palette_pick_batch_runs (started_at);
    create index idx_ppbatch_run_date
        on palette_pick_batch_runs (run_date);

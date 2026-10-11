<?php
/**
 * Plugin Name: WP Content Autopilot Bridge
 * Plugin URI: https://github.com/exelentshakil/wp-content-autopilot
 * Description: Seamless REST API bridge for WP Content Autopilot: enables direct REST updates for Header and Footer Scripts (_inpost_head_script / synth_header_script), guarantees Schema.org FAQ JSON-LD output in <head>, provides site-wide interactive FAQ accordion toggles, automates Easy Accordion (sp_easy_accordion) creation with David Atoyan metadata & FAQs, and auto-clears WP Rocket cache on REST publishing.
 * Version: 1.1.0
 * Author: Atoyan Law Firm / Exelent Shakil
 * Author URI: https://www.atoyanlaw.com
 * License: GPL-2.0+
 */

if ( ! defined( "ABSPATH" ) ) {
    exit;
}

class WP_Content_Autopilot_Bridge {

    /**
     * Singleton instance
     */
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( "init", array( $this, "register_rest_meta" ) );
        add_action( "rest_after_insert_page", array( $this, "handle_rest_page_update" ), 10, 3 );
        add_action( "rest_after_insert_post", array( $this, "handle_rest_page_update" ), 10, 3 );
        add_action( "rest_after_insert_sp_easy_accordion", array( $this, "handle_rest_accordion_update" ), 10, 3 );
        add_action( "wp_head", array( $this, "render_head_script_fallback" ), 99 );
        add_action( "wp_footer", array( $this, "render_accordion_script" ), 99 );
        add_action( "rest_api_init", array( $this, "register_custom_routes" ) );
        add_filter( "the_content", array( $this, "clean_faq_empty_paragraphs" ), 99 );
        add_filter( "acf/format_value", array( $this, "clean_faq_empty_paragraphs" ), 99 );
    }

    /**
     * 1. Register REST meta for pages, posts, and sp_easy_accordion.
     */
    public function register_rest_meta() {
        foreach ( array( "page", "post" ) as $post_type ) {
            register_post_meta(
                $post_type,
                "_inpost_head_script",
                array(
                    "show_in_rest" => array(
                        "schema" => array(
                            "type"       => "object",
                            "properties" => array(
                                "synth_header_script" => array(
                                    "type" => "string",
                                ),
                            ),
                            "additionalProperties" => true,
                        ),
                    ),
                    "single"        => true,
                    "type"          => "object",
                    "auth_callback" => function() {
                        return current_user_can( "edit_pages" );
                    },
                )
            );

            // Also register flat key for maximum compatibility
            register_post_meta(
                $post_type,
                "_inpost_head_script_synth_header_script",
                array(
                    "show_in_rest"  => true,
                    "single"        => true,
                    "type"          => "string",
                    "auth_callback" => function() {
                        return current_user_can( "edit_pages" );
                    },
                )
            );
        }

        // Register Easy Accordion metadata for REST API access
        foreach ( array( "sp_easy_accordion" ) as $post_type ) {
            register_post_meta(
                $post_type,
                "sp_eap_shortcode_options",
                array(
                    "show_in_rest"  => array(
                        "schema" => array(
                            "type"                 => "object",
                            "additionalProperties" => true,
                        ),
                    ),
                    "single"        => true,
                    "type"          => "object",
                    "auth_callback" => function() {
                        return current_user_can( "edit_posts" );
                    },
                )
            );

            register_post_meta(
                $post_type,
                "sp_eap_upload_options",
                array(
                    "show_in_rest"  => array(
                        "schema" => array(
                            "type"                 => "object",
                            "additionalProperties" => true,
                        ),
                    ),
                    "single"        => true,
                    "type"          => "object",
                    "auth_callback" => function() {
                        return current_user_can( "edit_posts" );
                    },
                )
            );
        }
    }

    /**
     * 2. Intercept REST page creations/updates to ensure _inpost_head_script is stored
     * as an exact serialized array matching Header and Footer Scripts (shfs).
     */
    public function handle_rest_page_update( $post, $request, $creating ) {
        $post_id = $post->ID;
        $body = $request->get_json_params();
        if ( ! is_array( $body ) ) {
            return;
        }

        $script = null;

        // Check meta._inpost_head_script
        if ( ! empty( $body["meta"]["_inpost_head_script"] ) ) {
            $m = $body["meta"]["_inpost_head_script"];
            if ( is_array( $m ) && ! empty( $m["synth_header_script"] ) ) {
                $script = $m["synth_header_script"];
            } elseif ( is_string( $m ) ) {
                $script = $m;
            }
        }

        // Check acf._inpost_head_script
        if ( empty( $script ) && ! empty( $body["acf"]["_inpost_head_script"] ) ) {
            $a = $body["acf"]["_inpost_head_script"];
            if ( is_array( $a ) && ! empty( $a["synth_header_script"] ) ) {
                $script = $a["synth_header_script"];
            } elseif ( is_string( $a ) ) {
                $script = $a;
            }
        }

        // Check direct top-level fields
        if ( empty( $script ) && ! empty( $body["_inpost_head_script"] ) ) {
            $t = $body["_inpost_head_script"];
            if ( is_array( $t ) && ! empty( $t["synth_header_script"] ) ) {
                $script = $t["synth_header_script"];
            } elseif ( is_string( $t ) ) {
                $script = $t;
            }
        }

        if ( empty( $script ) && ! empty( $body["synth_header_script"] ) ) {
            $script = $body["synth_header_script"];
        }

        // If a script was passed, write it in the exact serialized format expected by shfs
        if ( ! empty( $script ) ) {
            $current_meta = get_post_meta( $post_id, "_inpost_head_script", true );
            $data_to_save = is_array( $current_meta ) ? $current_meta : array();
            $data_to_save["synth_header_script"] = $script;

            update_post_meta( $post_id, "_inpost_head_script", $data_to_save );
            update_post_meta( $post_id, "_inpost_head_script_synth_header_script", $script );
        }

        // Auto-purge WP Rocket cache for this page so updates appear instantly
        if ( function_exists( "rocket_clean_post" ) ) {
            rocket_clean_post( $post_id );
        }
    }

    /**
     * 3. Intercept REST sp_easy_accordion inserts to persist options into postmeta.
     */
    public function handle_rest_accordion_update( $post, $request, $creating ) {
        $post_id = $post->ID;
        $body = $request->get_json_params();
        if ( ! is_array( $body ) ) {
            return;
        }

        $shortcode_opts = null;
        if ( ! empty( $body["meta"]["sp_eap_shortcode_options"] ) ) {
            $shortcode_opts = $body["meta"]["sp_eap_shortcode_options"];
        } elseif ( ! empty( $body["sp_eap_shortcode_options"] ) ) {
            $shortcode_opts = $body["sp_eap_shortcode_options"];
        }

        if ( $shortcode_opts ) {
            if ( isset( $shortcode_opts[0] ) && is_array( $shortcode_opts[0] ) ) {
                $shortcode_opts = $shortcode_opts[0];
            }
            update_post_meta( $post_id, "sp_eap_shortcode_options", $shortcode_opts );
        }

        $upload_opts = null;
        if ( ! empty( $body["meta"]["sp_eap_upload_options"] ) ) {
            $upload_opts = $body["meta"]["sp_eap_upload_options"];
        } elseif ( ! empty( $body["sp_eap_upload_options"] ) ) {
            $upload_opts = $body["sp_eap_upload_options"];
        }

        if ( $upload_opts ) {
            if ( isset( $upload_opts[0] ) && is_array( $upload_opts[0] ) ) {
                $upload_opts = $upload_opts[0];
            }
            update_post_meta( $post_id, "sp_eap_upload_options", $upload_opts );
        }

        if ( function_exists( "rocket_clean_post" ) ) {
            rocket_clean_post( $post_id );
        }
    }

    /**
     * 4. Fallback renderer for <head>: If Header and Footer Scripts plugin is inactive
     * or failed to echo, output the script safely before </head>.
     */
    public function render_head_script_fallback() {
        if ( ! is_singular() ) {
            return;
        }

        $post_id = get_the_ID();
        if ( ! $post_id ) {
            return;
        }

        $shfs_meta = get_post_meta( $post_id, "_inpost_head_script", true );
        $script = "";

        if ( is_array( $shfs_meta ) && ! empty( $shfs_meta["synth_header_script"] ) ) {
            $script = $shfs_meta["synth_header_script"];
        } elseif ( is_string( $shfs_meta ) && ! empty( $shfs_meta ) ) {
            $script = $shfs_meta;
        } else {
            $subkey = get_post_meta( $post_id, "_inpost_head_script_synth_header_script", true );
            if ( ! empty( $subkey ) ) {
                $script = $subkey;
            }
        }

        global $wp_actions;
        if ( ! empty( $script ) && ! class_exists( "HeaderAndFooterScripts" ) ) {
            echo "<!-- WP Content Autopilot Head Script -->\n";
            echo $script, "\n";
        }
    }

    /**
     * 5. Site-wide FAQ Accordion Toggle JS:
     * Delegated, zero-dependency, immune to wpautop and WP Rocket lazyloading.
     */
    public function render_accordion_script() {
        ?>
        <script id="wp-content-autopilot-accordion-js">
        (function() {
            function cleanRogueFaqElements() {
                try {
                    var pElements = document.querySelectorAll(".atoyan-custom-faq-accordion p");
                    pElements.forEach(function(p) {
                        if (!p.textContent.trim() && !p.querySelector("img,a,iframe,svg")) {
                            p.remove();
                        }
                    });
                    var brElements = document.querySelectorAll(".atoyan-custom-faq-accordion .atoyan-faq-toggle br, .atoyan-custom-faq-accordion .atoyan-faq-header br, .atoyan-custom-faq-accordion .atoyan-faq-card > br");
                    brElements.forEach(function(b) { b.remove(); });
                } catch(e) {}
            }
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", cleanRogueFaqElements);
            } else {
                cleanRogueFaqElements();
            }
            function handleAccordionToggle(e) {
                var atoyanBtn = e.target.closest(".atoyan-faq-toggle, .atoyan-faq-header");
                if (atoyanBtn) {
                    var card = atoyanBtn.closest(".atoyan-faq-card");
                    if (!card) return;
                    var collapse = card.querySelector(".atoyan-faq-collapse");
                    if (!collapse) return;
                    var toggle = card.querySelector(".atoyan-faq-toggle");
                    var icon = card.querySelector(".atoyan-faq-icon");
                    var isOpen = card.classList.contains("atoyan-faq-open") || collapse.style.display === "block";

                    var list = card.closest(".atoyan-faq-list, .atoyan-custom-faq-accordion");
                    if (list) {
                        var siblings = list.querySelectorAll(".atoyan-faq-card");
                        siblings.forEach(function(sib) {
                            if (sib !== card) {
                                sib.classList.remove("atoyan-faq-open");
                                var sCollapse = sib.querySelector(".atoyan-faq-collapse");
                                if (sCollapse) { sCollapse.style.display = "none"; }
                                var sToggle = sib.querySelector(".atoyan-faq-toggle");
                                if (sToggle) { sToggle.setAttribute("aria-expanded", "false"); }
                                var sIcon = sib.querySelector(".atoyan-faq-icon");
                                if (sIcon) { sIcon.textContent = "+"; }
                            }
                        });
                    }

                    if (isOpen) {
                        collapse.style.display = "none";
                        card.classList.remove("atoyan-faq-open");
                        if (toggle) { toggle.setAttribute("aria-expanded", "false"); }
                        if (icon) { icon.textContent = "+"; }
                    } else {
                        collapse.style.display = "block";
                        card.classList.add("atoyan-faq-open");
                        if (toggle) { toggle.setAttribute("aria-expanded", "true"); }
                        if (icon) { icon.textContent = "−"; }
                    }

                    if (e.cancelable) { e.preventDefault(); }
                    e.stopPropagation();
                    return;
                }

                var header = e.target.closest(".ea-header, .sp-ea-single .ea-header a");
                if (!header) return;

                var lCard = header.closest(".ea-card, .sp-ea-single");
                if (!lCard) return;

                var lBody = lCard.querySelector(".sp-collapse, [id^=ea-collapse]");
                if (!lBody) return;

                var lLink = lCard.querySelector(".ea-header a, a[role=button]");
                var lIcon = lCard.querySelector(".ea-expand-icon");
                var lIsExpanded = lCard.classList.contains("ea-expand") || lBody.classList.contains("show") || lBody.style.display === "block";

                var lContainer = lCard.closest(".sp-ea-one, .sp-easy-accordion");
                if (lContainer) {
                    var lSiblings = lContainer.querySelectorAll(".sp-ea-single, .ea-card");
                    lSiblings.forEach(function(sib) {
                        if (sib !== lCard) {
                            sib.classList.remove("ea-expand");
                            var sBody = sib.querySelector(".sp-collapse, [id^=ea-collapse]");
                            if (sBody) {
                                sBody.style.display = "none";
                                sBody.classList.remove("show");
                                sBody.classList.add("collapsed");
                            }
                            var sLink = sib.querySelector(".ea-header a, a[role=button]");
                            if (sLink) {
                                sLink.classList.add("collapsed");
                                sLink.setAttribute("aria-expanded", "false");
                            }
                            var sIcon = sib.querySelector(".ea-expand-icon");
                            if (sIcon) { sIcon.textContent = "+"; }
                        }
                    });
                }

                if (lIsExpanded) {
                    lBody.style.display = "none";
                    lBody.classList.remove("show");
                    lBody.classList.add("collapsed");
                    lCard.classList.remove("ea-expand");
                    if (lLink) {
                        lLink.classList.add("collapsed");
                        lLink.setAttribute("aria-expanded", "false");
                    }
                    if (lIcon) { lIcon.textContent = "+"; }
                } else {
                    lBody.style.display = "block";
                    lBody.classList.add("show");
                    lBody.classList.remove("collapsed");
                    lCard.classList.add("ea-expand");
                    if (lLink) {
                        lLink.classList.remove("collapsed");
                        lLink.setAttribute("aria-expanded", "true");
                    }
                    if (lIcon) { lIcon.textContent = "−"; }
                }

                if (e.cancelable && e.type === "click") {
                    e.preventDefault();
                }
            }

            document.addEventListener("click", handleAccordionToggle, true);
            document.addEventListener("keydown", function(e) {
                if ((e.key === "Enter" || e.key === " ") && (e.target.closest(".ea-header a") || e.target.closest(".atoyan-faq-toggle"))) {
                    handleAccordionToggle(e);
                }
            }, true);
        })();
        </script>
        <?php
    }

    /**
     * 6. Custom REST Endpoints for WP Content Autopilot:
     * - /wp-json/autopilot/v1/head-script (POST)
     * - /wp-json/autopilot/v1/purge-cache (POST)
     * - /wp-json/autopilot/v1/accordion (POST) - Create or update Easy Accordion
     * - /wp-json/autopilot/v1/accordions (GET) - List all Easy Accordions
     * - /wp-json/autopilot/v1/accordion/(?P<id>\\d+) (GET, DELETE)
     */
    public function register_custom_routes() {
        register_rest_route(
            "autopilot/v1",
            "/head-script",
            array(
                "methods"             => "POST",
                "callback"            => array( $this, "rest_set_head_script" ),
                "permission_callback" => function() {
                    return current_user_can( "edit_pages" );
                },
            )
        );

        register_rest_route(
            "autopilot/v1",
            "/purge-cache",
            array(
                "methods"             => "POST",
                "callback"            => array( $this, "rest_purge_cache" ),
                "permission_callback" => function() {
                    return current_user_can( "edit_pages" );
                },
            )
        );

        register_rest_route(
            "autopilot/v1",
            "/accordion",
            array(
                "methods"             => "POST",
                "callback"            => array( $this, "rest_create_or_update_accordion" ),
                "permission_callback" => function() {
                    return current_user_can( "edit_posts" );
                },
            )
        );

        register_rest_route(
            "autopilot/v1",
            "/accordions",
            array(
                "methods"             => "GET",
                "callback"            => array( $this, "rest_get_accordions" ),
                "permission_callback" => "__return_true",
            )
        );

        register_rest_route(
            "autopilot/v1",
            "/accordion/(?P<id>\\d+)",
            array(
                array(
                    "methods"             => "GET",
                    "callback"            => array( $this, "rest_get_single_accordion" ),
                    "permission_callback" => "__return_true",
                ),
                array(
                    "methods"             => "DELETE",
                    "callback"            => array( $this, "rest_delete_single_accordion" ),
                    "permission_callback" => function() {
                        return current_user_can( "delete_posts" );
                    },
                ),
            )
        );
    }

    public function rest_set_head_script( $request ) {
        $params  = $request->get_json_params();
        $post_id = ! empty( $params["post_id"] ) ? intval( $params["post_id"] ) : 0;
        $script  = ! empty( $params["script"] ) ? $params["script"] : "";

        if ( ! $post_id ) {
            return new WP_Error( "invalid_post_id", "Valid post_id is required", array( "status" => 400 ) );
        }

        $data = array( "synth_header_script" => $script );
        update_post_meta( $post_id, "_inpost_head_script", $data );
        update_post_meta( $post_id, "_inpost_head_script_synth_header_script", $script );

        if ( function_exists( "rocket_clean_post" ) ) {
            rocket_clean_post( $post_id );
        }

        return rest_ensure_response( array(
            "success" => true,
            "post_id" => $post_id,
            "saved"   => true,
        ) );
    }

    public function rest_purge_cache( $request ) {
        $params  = $request->get_json_params();
        $post_id = ! empty( $params["post_id"] ) ? intval( $params["post_id"] ) : 0;

        $cleared = false;
        if ( function_exists( "rocket_clean_post" ) && $post_id ) {
            rocket_clean_post( $post_id );
            $cleared = true;
        } elseif ( function_exists( "rocket_clean_domain" ) ) {
            rocket_clean_domain();
            $cleared = true;
        }

        return rest_ensure_response( array(
            "success" => true,
            "cleared" => $cleared,
        ) );
    }

    /**
     * 7. Creates or updates an Easy Accordion (sp_easy_accordion) with David Atoyan metadata.
     */
    public function rest_create_or_update_accordion( $request ) {
        $params = $request->get_json_params();
        if ( ! is_array( $params ) ) {
            $params = $request->get_params();
        }

        $title = ! empty( $params["title"] ) ? sanitize_text_field( $params["title"] ) : "";
        if ( empty( $title ) ) {
            return new WP_Error( "missing_title", "Accordion title is required", array( "status" => 400 ) );
        }

        $post_id = ! empty( $params["id"] ) ? intval( $params["id"] ) : 0;
        $city = ! empty( $params["city"] ) ? sanitize_text_field( $params["city"] ) : "";
        $topic = ! empty( $params["topic"] ) ? sanitize_text_field( $params["topic"] ) : ( ! empty( $params["keyword"] ) ? sanitize_text_field( $params["keyword"] ) : "" );

        if ( $post_id > 0 ) {
            $existing = get_post( $post_id );
            if ( ! $existing || $existing->post_type !== "sp_easy_accordion" ) {
                return new WP_Error( "not_found", "Easy Accordion post not found", array( "status" => 404 ) );
            }
            wp_update_post( array(
                "ID"         => $post_id,
                "post_title" => $title,
            ) );
        } else {
            $post_id = wp_insert_post( array(
                "post_title"  => $title,
                "post_status" => "publish",
                "post_type"   => "sp_easy_accordion",
            ) );

            if ( is_wp_error( $post_id ) ) {
                return $post_id;
            }
        }

        // Build exact Shortcode Options per David Atoyan specifications
        $shortcode_options = array(
            "eap_accordion_layout"            => "vertical",
                "accordion_margin_bottom"         => array( "all" => 10 ),
                "eap_accordion_event"             => "ea-click",
                "eap_accordion_mode"              => "ea-first-open",
                "eap_mutliple_collapse"           => false,
                "eap_scroll_to_active_item"       => false,
                "eap_schema_markup"               => false,
                "eap_preloader"                   => false,
                "eap_faq_search"                  => false,
                "eap_faq_collapse_button"         => false,
                "eap_accordion_theme"             => "sp-ea-one",
                "section_title"                   => false,
                "eap_border_css"                  => array(
                    "all"   => 1,
                    "style" => "solid",
                    "color" => "#e2e2e2",
                ),
                "ea_title_heading_tag"            => "3",
                "eap_title_color"                 => array( "color1" => "#444" ),
                "eap_header_bg_color"             => "#eee",
                "eap_nofollow_link"               => false,
                "eap_title_padding"               => array(
                    "top"    => 15,
                    "right"  => 15,
                    "bottom" => 15,
                    "left"   => 15,
                ),
                "eap_title_icon"                  => false,
                "eap_title_icon_size"             => array( "all" => 20 ),
                "eap_dsc_color"                   => "#444",
                "eap_description_bg_color"        => "#fff",
                "eap_description_padding"         => array(
                    "top"    => 15,
                    "right"  => 15,
                    "bottom" => 15,
                    "left"   => 15,
                ),
                "eap_accordion_fillspace"         => false,
                "eap_accordion_fillspace_height"  => array( "all" => 200 ),
                "eap_autop"                       => true,
                "eap_expand_close_icon"           => true,
                "eap_expand_collapse_icon"        => "1",
                "eap_icon_size"                   => array( "all" => 16 ),
                "eap_icon_color_set"              => "#444",
                "eap_icon_position"               => "left",
                "eap_animation"                   => false,
                "eap_animation_style"             => "normal",
                "eap_animation_time"              => 300,
                "eap_accordion_uniq_id"           => "sp_easy_accordion-" . mt_rand( 1000000000, 2147483647 ),
                "pagination_color"                => array(
                    "text_color"        => "#5e5e5e",
                    "text_active_clr"   => "#ffffff",
                    "border_color"      => "#bbbbbb",
                    "border_active_clr" => "#FE7C4D",
                    "background"        => "#ffffff",
                    "active_background" => "#FE7C4D",
                ),
                "section_title_font_load"         => false,
                "eap_section_title_typography"    => array(
                    "font-family"    => "Open Sans",
                    "font-weight"    => "",
                    "font-style"     => "600",
                    "subset"         => "",
                    "text-align"     => "left",
                    "text-transform" => "none",
                    "font-size"      => "28",
                    "line-height"    => "32",
                    "letter-spacing" => "0",
                    "color"          => "#444",
                    "margin-bottom"  => "30",
                    "type"           => "google",
                    "unit"           => "px",
                ),
                "eap_title_font_load"             => "",
                "eap_title_typography"            => array(
                    "font-family"    => "Open Sans",
                    "font-weight"    => "",
                    "font-style"     => "600",
                    "subset"         => "",
                    "text-align"     => "left",
                    "text-transform" => "none",
                    "font-size"      => "20",
                    "line-height"    => "30",
                    "letter-spacing" => "0",
                    "type"           => "google",
                    "unit"           => "px",
                ),
                "eap_desc_font_load"              => "",
                "eap_content_typography"          => array(
                    "font-family"    => "Open Sans",
                    "font-weight"    => "",
                    "font-style"     => "400",
                    "subset"         => "",
                    "text-align"     => "left",
                    "text-transform" => "none",
                    "font-size"      => "16",
                    "line-height"    => "26",
                    "letter-spacing" => "0",
                    "type"           => "google",
                    "unit"           => "px",
                ),
        );

        // Allow overriding shortcode options if explicitly provided
        if ( ! empty( $params["shortcode_options"] ) && is_array( $params["shortcode_options"] ) ) {
            $shortcode_options = $params["shortcode_options"];
            if ( isset( $shortcode_options[0] ) && is_array( $shortcode_options[0] ) ) {
                $shortcode_options = $shortcode_options[0];
            }
        }

        // Build FAQ Upload Options
        $accordion_content_source = array();
        $raw_faqs = ! empty( $params["faqs"] ) && is_array( $params["faqs"] ) ? $params["faqs"] : array();

        foreach ( $raw_faqs as $item ) {
            $q = "";
            $a = "";

            if ( ! empty( $item["accordion_content_title"] ) ) {
                $q = $item["accordion_content_title"];
            } elseif ( ! empty( $item["question"] ) ) {
                $q = $item["question"];
            }

            if ( ! empty( $item["accordion_content_description"] ) ) {
                $a = $item["accordion_content_description"];
            } elseif ( ! empty( $item["answer"] ) ) {
                $a = $item["answer"];
            }

            if ( ! empty( $q ) && ! empty( $a ) ) {
                $accordion_content_source[] = array(
                    "accordion_content_title"       => wp_strip_all_tags( $q ),
                    "accordion_content_description" => $a,
                );
            }
        }

        // If city or topic is provided, ensure concluding localized CTA in the final FAQ item
        if ( ! empty( $accordion_content_source ) && ( ! empty( $city ) || ! empty( $topic ) ) ) {
            $last_idx = count( $accordion_content_source ) - 1;
            $last_desc = $accordion_content_source[$last_idx]["accordion_content_description"];
            if ( strpos( $last_desc, "Talk to a" ) === false && strpos( $last_desc, "807-0077" ) === false ) {
                $loc_city = ! empty( $city ) ? $city : "California";
                $loc_topic = ! empty( $topic ) ? $topic : "Employment Law";
                $cta_slug = sanitize_title( "talk to a {$loc_city} {$loc_topic} lawyer" );
                $cta_html = sprintf(
                    "<h2 id=\"%s\" class=\"font-semibold leading-tight text-pretty mb-2 mt-4 text-base\">Talk to a %s %s Lawyer</h2><p class=\"my-2\">If you believe your workplace rights were violated, time limits apply. <strong>Contact Atoyan Law at (888) 807-0077</strong> or through the online form at <a class=\"reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline\" href=\"https://www.atoyanlaw.com/contact/\" target=\"_blank\" rel=\"noopener\"><span class=\"text-box-trim-both\">atoyanlaw.com</span></a> for a free, confidential case evaluation.</p>",
                    esc_attr( $cta_slug ),
                    esc_html( $loc_city ),
                    esc_html( $loc_topic )
                );
                $accordion_content_source[$last_idx]["accordion_content_description"] .= "\r\n" . $cta_html;
            }
        }

        $upload_options = array(
            "eap_accordion_type"       => "content-accordion",
            "accordion_content_source" => $accordion_content_source,
            "eap_post_type"            => "sp_accordion_faqs",
            "post_order_by"            => "date",
            "post_order"               => "DESC",
        );

        if ( ! empty( $params["upload_options"] ) && is_array( $params["upload_options"] ) ) {
            $upload_options = $params["upload_options"];
            if ( isset( $upload_options[0] ) && is_array( $upload_options[0] ) ) {
                $upload_options = $upload_options[0];
            }
        }

        // Update post meta in wp_postmeta
        update_post_meta( $post_id, "sp_eap_shortcode_options", $shortcode_options );
        update_post_meta( $post_id, "sp_eap_upload_options", $upload_options );

        // Purge WP Rocket cache
        if ( function_exists( "rocket_clean_post" ) ) {
            rocket_clean_post( $post_id );
        }

        return rest_ensure_response( array(
            "success"   => true,
            "id"        => $post_id,
            "title"     => $title,
            "shortcode" => sprintf( "[sp_easyaccordion id=\"%d\"]", $post_id ),
            "count"     => count( $accordion_content_source ),
        ) );
    }

    /**
     * 8. Retrieves a list of all Easy Accordion posts.
     */
    public function rest_get_accordions( $request ) {
        $posts = get_posts( array(
            "post_type"      => "sp_easy_accordion",
            "post_status"    => "publish",
            "posts_per_page" => 100,
            "orderby"        => "date",
            "order"          => "DESC",
        ) );

        $items = array();
        foreach ( $posts as $p ) {
            $items[] = array(
                "id"        => $p->ID,
                "title"     => $p->post_title,
                "shortcode" => sprintf( "[sp_easyaccordion id=\"%d\"]", $p->ID ),
            );
        }

        return rest_ensure_response( array(
            "success"    => true,
            "accordions" => $items,
            "count"      => count( $items ),
        ) );
    }

    /**
     * 9. Retrieves details of a single Easy Accordion post.
     */
    public function rest_get_single_accordion( $request ) {
        $id = intval( $request["id"] );
        $post = get_post( $id );
        if ( ! $post || $post->post_type !== "sp_easy_accordion" ) {
            return new WP_Error( "not_found", "Easy Accordion post not found", array( "status" => 404 ) );
        }

        $shortcode_options = get_post_meta( $id, "sp_eap_shortcode_options", true );
        $upload_options    = get_post_meta( $id, "sp_eap_upload_options", true );

        return rest_ensure_response( array(
            "id"                => $post->ID,
            "title"             => $post->post_title,
            "shortcode"         => sprintf( "[sp_easyaccordion id=\"%d\"]", $post->ID ),
            "shortcode_options" => $shortcode_options,
            "upload_options"    => $upload_options,
        ) );
    }

    /**
     * 10. Deletes a single Easy Accordion post.
     */
    public function rest_delete_single_accordion( $request ) {
        $id = intval( $request["id"] );
        $post = get_post( $id );
        if ( ! $post || $post->post_type !== "sp_easy_accordion" ) {
            return new WP_Error( "not_found", "Easy Accordion post not found", array( "status" => 404 ) );
        }

        $deleted = wp_delete_post( $id, true );
        return rest_ensure_response( array(
            "success" => (bool) $deleted,
            "id"      => $id,
        ) );
    }

    /**
     * 11. Clean up any empty <p></p> or stray <br> tags inserted into the FAQ accordion markup by wpautop.
     */
    public function clean_faq_empty_paragraphs( $content ) {
        if ( ! is_string( $content ) || strpos( $content, "atoyan-custom-faq-accordion" ) === false ) {
            return $content;
        }

        return preg_replace_callback(
            "/<div class=\"atoyan-faq-section atoyan-custom-faq-accordion[\s\S]*?<\/div>\s*<\/div>/i",
            function( $matches ) {
                $block = $matches[0];
                $block = preg_replace( "/<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>/i", "", $block );
                $block = preg_replace( "/(<button[^>]*class=\"[^\"]*atoyan-faq-toggle[^\"]*\"[^>]*>)\s*<br\s*\/?>/i", "$1", $block );
                $block = preg_replace( "/<br\s*\/?>\s*(<\/button>)/i", "$1", $block );
                $block = preg_replace( "/(<span[^>]*class=\"[^\"]*atoyan-faq-(?:icon|title)[^\"]*\"[^>]*>)\s*<br\s*\/?>/i", "$1", $block );
                $block = preg_replace( "/<br\s*\/?>\s*(<\/span>)/i", "$1", $block );
                return $block;
            },
            $content
        );
    }
}

// Initialize the plugin
add_action( "plugins_loaded", array( "WP_Content_Autopilot_Bridge", "get_instance" ) );

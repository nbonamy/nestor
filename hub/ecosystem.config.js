
module.exports = {
  apps : [{
    name   : "nestor-hub",
    script : "./dist/index.mjs",
    watch: true,
		watch_delay: 1000,
		ignore_watch : ["config.yml*"],
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
}

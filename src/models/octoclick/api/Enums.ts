export enum CampaignStatus {
    ACTIVE = 1,
    PAUSED,
    ARCHIVED
}
export enum CreativeStatus {
    ARCHIVED = 1,
    BLOCKED,
    MODERATION,
    PAUSED,
    ACTIVE,
    DECLINED
}
export enum FilterType {
    ALLOW = 1,
    DENY
}
export enum AdType {
    POPUNDER = 2
}
export enum UserOccupationType {
    ADVERTISER = 2
}
export enum StatisticMetricType {
    IMPRESSION = "Impression",
    ADVERTISER_SPENT = "AdvertiserSpent"
}
export enum StatisticGroupByType {
    SITE_ID = "SiteId"
}
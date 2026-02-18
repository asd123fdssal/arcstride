package com.arcstride.common.enums;

public final class Enums {
    private Enums() {}

    public enum TitleType {
        GAME, VIDEO, BOOK
    }

    public enum UnitType {
        VOLUME, EPISODE, ROUTE
    }

    public enum ContentStatus {
        ACTIVE, HIDDEN, DELETED
    }

    public enum ProgressStatus {
        NONE, PROGRESS, DONE
    }

    public enum Visibility {
        PUBLIC, PRIVATE
    }

    public enum TargetType {
        TITLE, UNIT
    }

    public enum AcquisitionType {
        PURCHASE, SUBSCRIPTION, GIFT
    }
}

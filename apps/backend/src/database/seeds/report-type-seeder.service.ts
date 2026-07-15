import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { ReportType } from "../../modules/report-types/entities/report-type.entity";
import { ReportTypeEnum } from "../../common/enums/enums";

interface ReportTypeSeed {
    name: ReportTypeEnum;
    description: string;
    isActive: boolean;
    residentialDecibelThreshold?: number;
    commercialDecibelThreshold?: number;
}

const REPORT_TYPE_SEEDS: ReportTypeSeed[] = [
    {
        name: ReportTypeEnum.NOISE,
        description:
            "Report excessive noise violations such as loud music, construction noise, or industrial sounds that disturb the community.",
        isActive: true,
        residentialDecibelThreshold: 45.0,
        commercialDecibelThreshold: 55.0,
    },
    {
        name: ReportTypeEnum.LITTERING,
        description:
            "Report illegal disposal of waste, garbage, or refuse in public spaces, streets, parks, or waterways.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.VANDALISM,
        description:
            "Report deliberate destruction or defacement of public or private property, including graffiti and property damage.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.AIR_POLLUTION,
        description:
            "Report sources of harmful air quality degradation such as industrial smoke, vehicle emissions, or open burning.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.WATER_POLLUTION,
        description:
            "Report contamination of rivers, lakes, streams, or other water bodies by chemicals, sewage, or other harmful substances.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.SOIL_CONTAMINATION,
        description:
            "Report the presence of hazardous chemicals or pollutants in the soil that may pose health or environmental risks.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.ILLEGAL_DUMPING,
        description:
            "Report unauthorized disposal of large quantities of waste on public or private land outside of approved facilities.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.DEFORESTATION,
        description:
            "Report illegal or unsanctioned clearing, cutting, or burning of forests and trees in protected or regulated areas.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.HAZARDOUS_WASTE,
        description:
            "Report improper handling, storage, or disposal of hazardous materials including chemicals, batteries, electronics, or medical waste.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.WILDLIFE_POACHING,
        description:
            "Report illegal hunting, trapping, capturing, or trading of protected wildlife and animals.",
        isActive: true,
    },
    {
        name: ReportTypeEnum.OTHERS,
        description:
            "Report other environmental or community violations not covered by the specific categories above.",
        isActive: true,
    },
];

@Injectable()
export class ReportTypeSeederService implements OnApplicationBootstrap {
    constructor(private dataSource: DataSource) { }

    async onApplicationBootstrap() {
        await this.seedReportTypes();
    }

    async seedReportTypes() {
        if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
        }

        const reportTypeRepo: Repository<ReportType> =
            this.dataSource.getRepository(ReportType);

        let seededCount = 0;
        let skippedCount = 0;

        for (const seed of REPORT_TYPE_SEEDS) {
            const existing = await reportTypeRepo.findOneBy({ name: seed.name });
            if (existing) {
                skippedCount++;
                continue;
            }

            const reportType = reportTypeRepo.create(seed);
            await reportTypeRepo.save(reportType);
            seededCount++;
        }

        if (seededCount > 0) {
            console.log(`✔ Seeded ${seededCount} report type(s)`);
        }
        if (skippedCount > 0) {
            console.log(
                `• ${skippedCount} report type(s) already exist — skipping`,
            );
        }
    }
}

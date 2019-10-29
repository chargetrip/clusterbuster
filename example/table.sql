-- Table: public.points
CREATE EXTENSION postgis;
CREATE TABLE public.points
(
    id TEXT,
    wkb_geometry geometry(Point,4326),
    speed TEXT,
    status TEXT,

    PRIMARY KEY(id)
)

TABLESPACE pg_default;

GRANT ALL ON TABLE public.points TO "tiler";
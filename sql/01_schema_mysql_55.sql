SET NAMES utf8;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS maxwellplay DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE maxwellplay;

CREATE TABLE IF NOT EXISTS Usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  contrasenia VARCHAR(255) NOT NULL,
  rol ENUM('DOCENTE','ESTUDIANTE') NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Sesion (
  id_sesion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  inicio DATETIME NOT NULL,
  expira DATETIME NOT NULL,
  token VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Estudiante (
  id_estudiante INT PRIMARY KEY,
  codigo VARCHAR(30) DEFAULT NULL,
  grado VARCHAR(10),
  FOREIGN KEY (id_estudiante) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Docente (
  id_docente INT PRIMARY KEY,
  especializacion VARCHAR(120),
  FOREIGN KEY (id_docente) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Asignacion (
  id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
  id_docente INT NOT NULL,
  id_estudiante INT NOT NULL,
  fecha DATE NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (id_docente) REFERENCES Docente(id_docente),
  FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Minijuego (
  id_juego INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  UNIQUE KEY uq_minijuego_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS juego_sesiones (
  id_sesion INT AUTO_INCREMENT PRIMARY KEY,
  id_juego INT NOT NULL,
  id_estudiante INT NULL,
  inicio_ts DATETIME NOT NULL,
  fin_ts DATETIME NULL,
  tiempo_seg INT NULL,
  exito TINYINT(1) NOT NULL DEFAULT 0,
  KEY idx_js_juego (id_juego),
  KEY idx_js_est (id_estudiante),
  CONSTRAINT fk_js_juego FOREIGN KEY (id_juego) REFERENCES Minijuego(id_juego),
  CONSTRAINT fk_js_est FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Contenido (
  id_contenido INT AUTO_INCREMENT PRIMARY KEY,
  id_juego INT NOT NULL,
  tipo ENUM('IMG','AUDIO','VIDEO','JSON','OTRO') NOT NULL,
  url VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_juego) REFERENCES Minijuego(id_juego)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS ReglaPieza (
  id_regla INT AUTO_INCREMENT PRIMARY KEY,
  id_juego INT NOT NULL,
  tipo_pieza VARCHAR(60) NOT NULL,
  minimo INT NOT NULL,
  maximo INT NOT NULL,
  UNIQUE KEY uq_regla (id_juego, tipo_pieza),
  FOREIGN KEY (id_juego) REFERENCES Minijuego(id_juego)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS UmbralesJuego (
  id_umbral INT AUTO_INCREMENT PRIMARY KEY,
  id_juego INT NOT NULL,
  oro_seg INT NOT NULL,
  plata_seg INT NOT NULL,
  bronce_seg INT NOT NULL,
  UNIQUE KEY uq_umbral (id_juego),
  FOREIGN KEY (id_juego) REFERENCES Minijuego(id_juego)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS Progreso (
  id_progreso INT AUTO_INCREMENT PRIMARY KEY,
  id_estudiante INT NOT NULL,
  id_juego INT NOT NULL,
  mejor_tiempo INT,
  mejor_medalla ENUM('ORO','PLATA','BRONCE') DEFAULT NULL,
  completado TINYINT(1) NOT NULL DEFAULT 0,
  fec_ultima_actualizacion DATETIME NOT NULL,
  UNIQUE KEY uq_prog (id_estudiante, id_juego),
  FOREIGN KEY (id_estudiante) REFERENCES Estudiante(id_estudiante),
  FOREIGN KEY (id_juego) REFERENCES Minijuego(id_juego)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP VIEW IF EXISTS vw_docente_alumnos_resumen;
DROP VIEW IF EXISTS vw_alumno_juego_resumen;
DROP VIEW IF EXISTS vw_alumno_ult_sesion;
DROP VIEW IF EXISTS reglas_juego;
DROP VIEW IF EXISTS juegos;

CREATE OR REPLACE VIEW juegos AS
SELECT m.id_juego, m.slug, m.nombre
FROM Minijuego m;

CREATE OR REPLACE VIEW reglas_juego AS
SELECT u.id_juego, u.oro_seg, u.plata_seg, u.bronce_seg
FROM UmbralesJuego u;

CREATE OR REPLACE VIEW vw_alumno_ult_sesion AS
SELECT
  s.id_estudiante,
  s.id_juego,
  MAX(s.id_sesion) AS last_sesion_id
FROM juego_sesiones s
GROUP BY s.id_estudiante, s.id_juego;

CREATE OR REPLACE VIEW vw_alumno_juego_resumen AS
SELECT
  e.id_estudiante,
  u.nombre AS estudiante_nombre,
  j.id_juego,
  j.slug,
  j.nombre AS juego_nombre,
  s.id_sesion,
  s.inicio_ts,
  s.fin_ts,
  COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) AS tiempo_seg,
  s.exito,
  CASE
    WHEN s.exito = 0 THEN '—'
    WHEN COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) <= r.oro_seg THEN 'oro'
    WHEN COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) <= r.plata_seg THEN 'plata'
    WHEN COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) <= r.bronce_seg THEN 'bronce'
    ELSE 'participó'
  END AS insignia
FROM vw_alumno_ult_sesion uls
JOIN juego_sesiones s ON s.id_sesion = uls.last_sesion_id
JOIN juegos j ON j.id_juego = uls.id_juego
LEFT JOIN reglas_juego r ON r.id_juego = j.id_juego
JOIN Estudiante e ON e.id_estudiante = uls.id_estudiante
JOIN Usuario u ON u.id_usuario = e.id_estudiante;

CREATE OR REPLACE VIEW vw_docente_alumnos_resumen AS
SELECT
  e.id_estudiante,
  u.nombre AS estudiante_nombre,
  COALESCE(e.codigo, CAST(e.id_estudiante AS CHAR)) AS codigo,
  COUNT(DISTINCT CASE WHEN s.exito = 1 THEN s.id_juego END) AS aprobados,
  (SELECT COUNT(*) FROM juegos) - COUNT(DISTINCT CASE WHEN s.exito = 1 THEN s.id_juego END) AS pendientes,
  MAX(s.fin_ts) AS ultima_actividad
FROM Estudiante e
JOIN Usuario u ON u.id_usuario = e.id_estudiante
LEFT JOIN juego_sesiones s ON s.id_estudiante = e.id_estudiante
GROUP BY e.id_estudiante, u.nombre, codigo;

SET FOREIGN_KEY_CHECKS=1;

USE maxwellplay;

INSERT INTO Usuario (nombre, correo, contrasenia, rol) VALUES
('Docente Demo','docente@demo.com', MD5('demo123'), 'DOCENTE'),
('Estudiante Demo','estudiante@demo.com', MD5('demo123'),'ESTUDIANTE');

INSERT INTO Docente (id_docente, especializacion) VALUES (1,'Ciencias Naturales');
INSERT INTO Estudiante (id_estudiante, codigo, grado) VALUES (2,'ALU-0001','7°');

INSERT INTO Asignacion (id_docente, id_estudiante, fecha, activo)
VALUES (1,2,CURDATE(),1);

INSERT INTO Minijuego (slug, nombre, descripcion)
VALUES
('microondas','Microondas','Armar y validar piezas');

INSERT INTO juego_sesiones (id_juego, id_estudiante, inicio_ts, fin_ts, tiempo_seg, exito)
VALUES
(1,2,NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 45 SECOND, 45, 1),
(1,2,NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 90 SECOND, 90, 0);

INSERT IGNORE INTO ReglaPieza (id_juego, tipo_pieza, minimo, maximo) VALUES
(1,'magnetron',1,1),
(1,'power',1,1),
(1,'cavity',1,1),
(1,'door',1,1),
(1,'plate',1,1);

INSERT IGNORE INTO UmbralesJuego (id_juego, oro_seg, plata_seg, bronce_seg)
VALUES (1,30,60,120);

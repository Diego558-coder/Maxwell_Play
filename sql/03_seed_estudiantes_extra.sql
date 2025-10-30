USE maxwellplay;


INSERT IGNORE INTO Usuario (nombre, correo, contrasenia, rol)
VALUES
('Estudiante Demo 2','estudiante2@demo.com', MD5('demo123'),'ESTUDIANTE'),
('Estudiante Demo 3','estudiante3@demo.com', MD5('demo123'),'ESTUDIANTE'),
('Estudiante Demo 4','estudiante4@demo.com', MD5('demo123'),'ESTUDIANTE'),
('Estudiante Demo 5','estudiante5@demo.com', MD5('demo123'),'ESTUDIANTE');


INSERT IGNORE INTO Estudiante (id_estudiante, codigo, grado)
SELECT u.id_usuario, CONCAT('ALU-', LPAD(u.id_usuario,4,'0')), '7°'
FROM Usuario u
WHERE u.correo IN (
  'estudiante2@demo.com',
  'estudiante3@demo.com',
  'estudiante4@demo.com',
  'estudiante5@demo.com'
);


INSERT IGNORE INTO Asignacion (id_docente, id_estudiante, fecha, activo)
SELECT d.id_docente, e.id_estudiante, CURDATE(), 1
FROM (
  SELECT id_docente FROM Docente ORDER BY id_docente LIMIT 1
) d
JOIN Estudiante e ON e.id_estudiante IN (
  SELECT id_usuario FROM Usuario WHERE correo IN (
    'estudiante2@demo.com','estudiante3@demo.com','estudiante4@demo.com','estudiante5@demo.com'
  )
);

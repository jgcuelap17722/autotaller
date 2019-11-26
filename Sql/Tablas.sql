-- Funciones Agregadas
    DROP TABLE tordenes_Actuales

CREATE TABLE testado_Orden (
  idEstadoOrden 	int(11)      NOT NULL AUTO_INCREMENT,
  nombre 		      varchar(50)  NOT NULL,
  PRIMARY KEY (idEstadoOrden)
);

INSERT INTO testado_orden (nombre)
VALUES ('Orden Finalizada');

-- =============================================

CREATE TABLE ttipoServicio (
  idTipoServicio	int(11)      NOT NULL AUTO_INCREMENT,
  nombre 		      varchar(50)  NOT NULL,
  PRIMARY KEY (idTipoServicio)
);

CREATE TABLE tHistorialCliente (
  idHistorial 			  int(11)     NOT NULL,
  id_vehiculo 		    int(11)     NOT NULL,
  id_estadoOrden 	    int(11)     NOT NULL,
  id_asesor 		      int(11)     NOT NULL,
  description_cliente TEXT        NULL,
  description_Aasesor TEXT        NULL,
  creacionOrden       timestamp   NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (idOrden),
  CONSTRAINT fk_asesor    FOREIGN KEY(id_asesor)      REFERENCES tusuario(id),
  CONSTRAINT fk_vehiculo  FOREIGN KEY(id_vehiculo)    REFERENCES tvehiculo(id_vehiculo),
  CONSTRAINT fk_estado    FOREIGN KEY(id_estadoOrden) REFERENCES testado_Orden(idEstadoOrden)
);


-- =============================================
CREATE TABLE tordenes_Actuales (
  idOrden 			      int(11)     NOT NULL,
  id_vehiculo 		    int(11)     NOT NULL,
  id_estadoOrden 	    int(11)     NOT NULL,
  id_asesor 		      int(11)     NOT NULL,
  description_cliente TEXT        NULL,
  description_Aasesor TEXT        NULL,
  creacionOrden       timestamp   NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (idOrden),
  CONSTRAINT fk_asesor    FOREIGN KEY(id_asesor)      REFERENCES tusuario(id),
  CONSTRAINT fk_vehiculo  FOREIGN KEY(id_vehiculo)    REFERENCES tvehiculo(id_vehiculo),
  CONSTRAINT fk_estado    FOREIGN KEY(id_estadoOrden) REFERENCES testado_Orden(idEstadoOrden)
);

-- =============================================
-- Drop the table 'TableName' in schema 'SchemaName'





use bd_autolinea;
ALTER TABLE tusuario
  ADD PRIMARY KEY (id);

CREATE TABLE torden (
  id INT(11) NOT NULL,
  title VARCHAR(150) NOT NULL,
  url VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INT(11),
  created_at timestamp NOT NULL DEFAULT current_timestamp,
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES tusuario(id)
);

ALTER TABLE torden
  ADD PRIMARY KEY (id);

ALTER TABLE torden
  MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 2;
USE [swpro]
GO

/****** Object:  Table [dbo].[swAuthClients]    Script Date: 10/16/2024 7:37:49 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[swAuthClients](
	[ClientID] [numeric](18, 0) IDENTITY(1,1) NOT NULL,
	[ClientUUID] [uniqueidentifier] NULL,
	[Name] [nvarchar](255) NULL,
	[mailUrl] [nvarchar](50) NULL,
	[LaunchApp] [numeric](18, 0) NULL,
	[LaunchPage] [numeric](18, 0) NULL,
	[LaunchAccessLevel] [bigint] NULL,
	[LaunchDB] [nvarchar](50) NULL,
	[activeFlag] [bit] NULL,
	[subscriber_id] [uniqueidentifier] NULL,
	[createDate] [datetime] NULL,
	[AccessLevel] [bigint] NULL,
	[SubscriberID] [uniqueidentifier] NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_ClientUUID]  DEFAULT (newid()) FOR [ClientUUID]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_Name]  DEFAULT ('no name provided') FOR [Name]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_mailUrl]  DEFAULT ('no mail url provided') FOR [mailUrl]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_LaunchApp]  DEFAULT ((1)) FOR [LaunchApp]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_LaunchPage]  DEFAULT ((3)) FOR [LaunchPage]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_LaunchAccessLevel]  DEFAULT ((1)) FOR [LaunchAccessLevel]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_LaunchDB]  DEFAULT ('SmartWeb') FOR [LaunchDB]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_activeFlag]  DEFAULT ((1)) FOR [activeFlag]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_createDate]  DEFAULT (getdate()) FOR [createDate]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_AccessLevel]  DEFAULT ((131071)) FOR [AccessLevel]
GO

ALTER TABLE [dbo].[swAuthClients] ADD  CONSTRAINT [DF_swAuthClients_SubscriberID]  DEFAULT ('C80E6FFC-910A-4C8F-9B90-C393178EA8F0') FOR [SubscriberID]
GO

